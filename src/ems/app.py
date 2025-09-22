from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

import uvicorn

from .api.app import APIContext, create_app
from .core.health import HealthRegistry
from .core.scheduler import Scheduler
from .drivers import create_driver
from .store.database import Database
# from .store.exporter import ParquetExporter  # Temporarily disabled due to pandas dependency
from .uplink.publisher import UplinkPublisher
from .export.service import ExportService
from .utils.config import AppConfig
from .utils.logging import setup_logging


class EMSApp:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.logger = setup_logging(config.global_.logging.level, config.global_.logging.json)
        self.health = HealthRegistry()
        self.scheduler = Scheduler(
            self.health, jitter_seconds=config.global_.scheduler.jitter_seconds
        )
        self.db = Database(config.global_.storage.sqlite_path)
        self.devices = [create_driver(device) for device in config.devices]
        self.device_status: Dict[str, Dict[str, Any]] = {
            device.device_id: {
                "device_id": device.device_id,
                "plant_id": device.plant_id,
                "type": device.type,
                "make": device.device_config.make,
                "model": device.device_config.model,
                "healthy": True,
                "message": None,
                "last_poll_utc": None,
            }
            for device in self.devices
        }
        self.export_service = ExportService(
            self.db,
            config.global_.export,
            [device.model_dump() for device in config.devices],
        )
        self.uplink = UplinkPublisher(self.db, config.global_.uplink)
        # self.parquet_exporter = ParquetExporter(self.db, config.global_.storage.export_parquet_dir)  # Temporarily disabled
        self._server: uvicorn.Server | None = None

    async def start(self) -> None:
        await self.db.connect()
        try:
            await self.export_service.push_register_maps()
        except Exception as exc:  # noqa: BLE001
            self.logger.warning("register_map_push_failed", error=str(exc))
        for device, device_config in zip(self.devices, self.config.devices):
            self.scheduler.schedule_periodic(
                name=f"poll-{device_config.id}",
                interval=device_config.poll_interval_s,
                coro_factory=lambda d=device: self._poll_device(d),
            )
        self.scheduler.schedule_periodic(
            name="uplink",
            interval=self.config.global_.uplink.batch_period_s,
            coro_factory=self.uplink.publish_window,
        )
        self.scheduler.schedule_periodic(
            name="retention",
            interval=86400,
            coro_factory=lambda: self.db.purge_old_measurements(
                self.config.global_.storage.retention_days
            ),
        )
        # self.scheduler.schedule_periodic(
        #     name="parquet_export",
        #     interval=self.config.global_.storage.export_interval_s,
        #     coro_factory=self.parquet_exporter.export_last_hour,
        # )  # Temporarily disabled due to pandas dependency
        api_context = APIContext(
            config=self.config,
            db=self.db,
            export_service=self.export_service,
            health=self.health,
            device_status=self.device_status,
            allow_control=self.config.global_.enable_control,
            dry_run=self.config.global_.dry_run,
        )
        app = create_app(api_context)
        config = uvicorn.Config(
            app,
            host=self.config.global_.api.bind_host,
            port=self.config.global_.api.port,
            log_config=None,
            loop="asyncio",
        )
        self._server = uvicorn.Server(config)
        await self._server.serve()

    async def _poll_device(self, driver: Any) -> None:
        device_id = driver.device_id
        try:
            measurements = await driver.read_points()
            if measurements:
                await self.db.insert_measurements(measurements)
            self.device_status[device_id].update(
                {
                    "healthy": True,
                    "message": "ok",
                    "last_poll_utc": datetime.now(timezone.utc).isoformat(),
                }
            )
        except Exception as exc:  # noqa: BLE001
            self.device_status[device_id].update(
                {
                    "healthy": False,
                    "message": str(exc),
                    "last_poll_utc": datetime.now(timezone.utc).isoformat(),
                }
            )
            raise

    async def shutdown(self) -> None:
        await self.scheduler.shutdown()
        await self.uplink.close()
        await self.export_service.close()


async def run_app(config: AppConfig) -> None:
    app = EMSApp(config)
    try:
        await app.start()
    finally:
        await app.shutdown()


__all__ = ["EMSApp", "run_app"]
