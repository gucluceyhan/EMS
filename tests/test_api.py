import pytest
from httpx import ASGITransport, AsyncClient

from ems.api.app import APIContext, create_app
from ems.core.health import HealthRegistry
from ems.store.database import Database
from ems.utils.config import AppConfig


class DummyExportService:
    async def snapshot(self, window_s: int = 60):
        return {"devices": []}

    async def register_maps(self):
        return {"devices": []}


def build_config(tmp_path, *, ui_enabled: bool = True) -> AppConfig:
    return AppConfig.model_validate(
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
                    "enabled": ui_enabled,
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


async def build_context(tmp_path, *, ui_enabled: bool = True, device_status=None):
    db = Database(str(tmp_path / "db.sqlite"))
    await db.connect()
    context = APIContext(
        config=build_config(tmp_path, ui_enabled=ui_enabled),
        db=db,
        export_service=DummyExportService(),
        health=HealthRegistry(),
        device_status=device_status or {},
        allow_control=False,
        dry_run=True,
    )
    return context, db


@pytest.mark.asyncio
async def test_health_endpoint(tmp_path):
    context, db = await build_context(tmp_path)
    app = create_app(context)
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ok"
            cfg = await client.get("/config", headers={"Authorization": "Bearer token"})
            assert cfg.status_code == 200
            assert cfg.json()["global"]["api"]["auth_token"] == "***"
    finally:
        if db._engine is not None:  # pragma: no cover - cleanup
            await db._engine.dispose()


@pytest.mark.asyncio
async def test_ui_disabled_returns_404(tmp_path):
    context, db = await build_context(tmp_path, ui_enabled=False)
    app = create_app(context)
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            html_resp = await client.get("/ui")
            assert html_resp.status_code == 404
            api_resp = await client.get("/ui/api/devices", auth=("user", "pass"))
            assert api_resp.status_code == 404
    finally:
        if db._engine is not None:  # pragma: no cover - cleanup
            await db._engine.dispose()


@pytest.mark.asyncio
async def test_ui_devices_basic_auth(tmp_path):
    device_status = {"dev-1": {"id": "dev-1", "name": "Device 1", "status": "online"}}
    context, db = await build_context(tmp_path, device_status=device_status)
    app = create_app(context)
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            unauthorized = await client.get("/ui/api/devices")
            assert unauthorized.status_code == 401
            authorized = await client.get("/ui/api/devices", auth=("user", "pass"))
            assert authorized.status_code == 200
            assert authorized.json() == list(device_status.values())
    finally:
        if db._engine is not None:  # pragma: no cover - cleanup
            await db._engine.dispose()
