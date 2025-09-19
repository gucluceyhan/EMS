import pytest
from httpx import AsyncClient

from ems.api.app import APIContext, create_app
from ems.core.health import HealthRegistry
from ems.store.database import Database
from ems.utils.config import AppConfig


class DummyExportService:
    async def snapshot(self, window_s: int = 60):
        return {"devices": []}

    async def register_maps(self):
        return {"devices": []}


@pytest.mark.asyncio
async def test_health_endpoint(tmp_path):
    db = Database(str(tmp_path / "db.sqlite"))
    await db.connect()
    config = AppConfig.model_validate(
        {
            "version": 1,
            "plant": {"id": "plant", "name": "Plant", "timezone": "UTC"},
            "global": {
                "enable_control": False,
                "dry_run": True,
                "storage": {
                    "sqlite_path": str(tmp_path / "db.sqlite"),
                    "retention_days": 30,
                    "export_parquet_dir": str(tmp_path / "exports"),
                    "export_interval_s": 3600,
                },
                "uplink": {
                    "url": "https://example.com",
                    "api_key": "key",
                    "batch_period_s": 300,
                    "max_batch_kb": 256,
                    "tls_verify": True,
                },
                "export": {
                    "enable": False,
                    "snapshot_url": "https://example.com/snapshot",
                    "registermap_url": "https://example.com/maps",
                    "auth_token": "token",
                    "include_raw_registers": False,
                },
                "api": {"bind_host": "127.0.0.1", "port": 8080, "auth_token": "token"},
                "ui": {
                    "enabled": True,
                    "bind_host": "127.0.0.1",
                    "port": 8080,
                    "basic_auth_user": "user",
                    "basic_auth_password": "pass",
                },
                "logging": {"level": "INFO", "json": True},
                "security": {"auth_token": "token"},
                "scheduler": {"jitter_seconds": 5, "watchdog_interval_s": 30},
            },
            "devices": [],
        }
    )
    context = APIContext(
        config=config,
        db=db,
        export_service=DummyExportService(),
        health=HealthRegistry(),
        device_status={},
        allow_control=False,
        dry_run=True,
    )
    app = create_app(context)
    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        cfg = await client.get("/config", headers={"Authorization": "Bearer token"})
        assert cfg.status_code == 200
        assert cfg.json()["global"]["api"]["auth_token"] == "***"
