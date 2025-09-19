from datetime import datetime, timezone

import pytest

from ems.export.service import ExportService
from ems.store.database import Database
from ems.utils.config import ExportConfig
from ems.utils.models import Measurement


@pytest.mark.asyncio
async def test_snapshot_payload(tmp_path):
    db_path = tmp_path / "db.sqlite"
    db = Database(str(db_path))
    await db.connect()
    measurement = Measurement(
        timestamp_utc=datetime.now(timezone.utc),
        plant_id="plant",
        device_id="dev",
        metric="AC_P",
        value=100.0,
        unit="kW",
        source="test",
    )
    await db.insert_measurements([measurement])
    export_config = ExportConfig(
        enable=False,
        snapshot_url="https://example.com/snapshot",
        registermap_url="https://example.com/maps",
        auth_token="token",
        include_raw_registers=False,
    )
    service = ExportService(db, export_config, devices=[])
    snapshot = await service.snapshot(window_s=60)
    assert snapshot["devices"]
    await service.close()
