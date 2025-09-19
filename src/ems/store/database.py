from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Sequence

from sqlalchemy import JSON, Boolean, DateTime, Float, Index, Integer, MetaData, String, select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from ..utils.models import Measurement

metadata = MetaData()


class Base(DeclarativeBase):
    metadata = metadata


class MeasurementRecord(Base):
    __tablename__ = "measurements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    plant_id: Mapped[str] = mapped_column(String(64), index=True)
    device_id: Mapped[str] = mapped_column(String(64), index=True)
    metric: Mapped[str] = mapped_column(String(128), index=True)
    value: Mapped[float | None] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(32))
    quality: Mapped[str] = mapped_column(String(16))
    source: Mapped[str] = mapped_column(String(64))
    raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index("idx_measurements_device_metric_ts", "device_id", "metric", "timestamp_utc"),
    )


class UplinkQueueRecord(Base):
    __tablename__ = "uplink_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ts_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    delivered: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Database:
    def __init__(self, path: str) -> None:
        self._path = Path(path)
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker[AsyncSession] | None = None

    async def connect(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite+aiosqlite:///{self._path}"
        self._engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        self._session_factory = async_sessionmaker(self._engine, expire_on_commit=False)
        await self._enable_wal()

    async def _enable_wal(self) -> None:
        assert self._engine is not None
        async with self._engine.begin() as conn:
            await conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            await conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")

    @property
    def session(self) -> async_sessionmaker[AsyncSession]:
        if self._session_factory is None:
            raise RuntimeError("Database not connected")
        return self._session_factory

    async def insert_measurements(self, measurements: Sequence[Measurement]) -> None:
        async with self.session() as session:
            session.add_all(
                [
                    MeasurementRecord(
                        timestamp_utc=m.timestamp_utc,
                        plant_id=m.plant_id,
                        device_id=m.device_id,
                        metric=m.metric,
                        value=m.value,
                        unit=m.unit,
                        quality=m.quality.value,
                        source=m.source,
                        raw=m.raw,
                    )
                    for m in measurements
                ]
            )
            await session.commit()

    async def latest_measurements(self, since: datetime | None = None) -> list[MeasurementRecord]:
        async with self.session() as session:
            stmt = (
                select(MeasurementRecord)
                .order_by(MeasurementRecord.timestamp_utc.desc())
                .limit(500)
            )
            if since:
                stmt = stmt.where(MeasurementRecord.timestamp_utc >= since)
            result = await session.execute(stmt)
            return list(result.scalars())

    async def measurements_for_device(
        self,
        device_id: str,
        metric: str | None = None,
        since: datetime | None = None,
        limit: int = 500,
    ) -> list[MeasurementRecord]:
        async with self.session() as session:
            stmt = select(MeasurementRecord).where(MeasurementRecord.device_id == device_id)
            if metric:
                stmt = stmt.where(MeasurementRecord.metric == metric)
            if since:
                stmt = stmt.where(MeasurementRecord.timestamp_utc >= since)
            stmt = stmt.order_by(MeasurementRecord.timestamp_utc.desc()).limit(limit)
            result = await session.execute(stmt)
            return list(result.scalars())

    async def enqueue_uplink(
        self, payload: dict[str, Any], ts_start: datetime, ts_end: datetime
    ) -> None:
        async with self.session() as session:
            session.add(
                UplinkQueueRecord(
                    ts_start=ts_start, ts_end=ts_end, payload=payload, delivered=False
                )
            )
            await session.commit()

    async def pending_uplink(self) -> list[UplinkQueueRecord]:
        async with self.session() as session:
            stmt = (
                select(UplinkQueueRecord)
                .where(UplinkQueueRecord.delivered.is_(False))
                .order_by(UplinkQueueRecord.ts_start)
            )
            result = await session.execute(stmt)
            return list(result.scalars())

    async def mark_uplink_delivered(self, record_id: int) -> None:
        async with self.session() as session:
            stmt = select(UplinkQueueRecord).where(UplinkQueueRecord.id == record_id)
            result = await session.execute(stmt)
            record = result.scalar_one()
            record.delivered = True
            await session.commit()

    async def purge_old_measurements(self, retention_days: int) -> None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        async with self.session() as session:
            await session.execute(
                MeasurementRecord.__table__.delete().where(MeasurementRecord.timestamp_utc < cutoff)
            )
            await session.commit()


__all__ = ["Database", "MeasurementRecord", "UplinkQueueRecord"]
