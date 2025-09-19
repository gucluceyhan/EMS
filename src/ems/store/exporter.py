from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from .database import Database


class ParquetExporter:
    def __init__(self, db: Database, export_dir: str) -> None:
        self._db = db
        self._dir = Path(export_dir)
        self._dir.mkdir(parents=True, exist_ok=True)

    async def export_last_hour(self) -> Path | None:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
        records = await self._db.latest_measurements(since=cutoff)
        if not records:
            return None
        df = pd.DataFrame(
            [
                {
                    "timestamp_utc": rec.timestamp_utc,
                    "plant_id": rec.plant_id,
                    "device_id": rec.device_id,
                    "metric": rec.metric,
                    "value": rec.value,
                    "unit": rec.unit,
                    "quality": rec.quality,
                    "source": rec.source,
                }
                for rec in records
            ]
        )
        filename = self._dir / f"measurements_{cutoff:%Y%m%d%H%M}.parquet"
        df.to_parquet(filename)
        return filename


__all__ = ["ParquetExporter"]
