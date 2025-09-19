from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from ..store.database import Database, MeasurementRecord
from ..utils.config import UplinkConfig


class UplinkPublisher:
    def __init__(self, db: Database, config: UplinkConfig) -> None:
        self._db = db
        self._config = config
        self._client = httpx.AsyncClient(timeout=10.0, verify=config.tls_verify)

    async def close(self) -> None:
        await self._client.aclose()

    async def publish_window(self) -> None:
        now = datetime.now(timezone.utc)
        ts_end = now.replace(second=0, microsecond=0)
        ts_start = ts_end - timedelta(seconds=self._config.batch_period_s)
        records = await self._db.latest_measurements(since=ts_start)
        payload = self._build_payload(records, ts_start, ts_end)
        await self._db.enqueue_uplink(payload, ts_start, ts_end)
        await self.flush()

    async def flush(self) -> None:
        pending = await self._db.pending_uplink()
        for row in pending:
            try:
                await self._client.post(
                    str(self._config.url),
                    headers={"Authorization": f"Bearer {self._config.api_key}"},
                    json=row.payload,
                )
            except httpx.HTTPError:
                continue
            else:
                await self._db.mark_uplink_delivered(row.id)

    def _build_payload(
        self, records: list[MeasurementRecord], ts_start: datetime, ts_end: datetime
    ) -> dict[str, Any]:
        devices: dict[str, list[dict[str, Any]]] = {}
        for rec in records:
            devices.setdefault(rec.device_id, []).append(
                {
                    "ts": rec.timestamp_utc.isoformat(),
                    "metric": rec.metric,
                    "value": rec.value,
                    "unit": rec.unit,
                    "quality": rec.quality,
                }
            )
        return {
            "plant_id": records[0].plant_id if records else None,
            "ts_start": ts_start.isoformat(),
            "ts_end": ts_end.isoformat(),
            "sample_period_s": 60,
            "devices": [
                {"device_id": device_id, "samples": samples}
                for device_id, samples in devices.items()
            ],
        }


__all__ = ["UplinkPublisher"]
