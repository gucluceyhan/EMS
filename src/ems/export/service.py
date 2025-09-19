from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from ..drivers.pointmap import load_point_map
from ..store.database import Database
from ..utils.config import ExportConfig


class ExportService:
    def __init__(
        self, db: Database, export_config: ExportConfig, devices: list[dict[str, Any]]
    ) -> None:
        self._db = db
        self._config = export_config
        self._devices = devices
        self._client = httpx.AsyncClient(timeout=10.0, verify=True)

    async def close(self) -> None:
        await self._client.aclose()

    async def snapshot(self, window_s: int = 60) -> dict[str, Any]:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_s)
        records = await self._db.latest_measurements(since=cutoff)
        device_map: dict[str, dict[str, Any]] = {}
        for rec in records:
            device = device_map.setdefault(
                rec.device_id,
                {"device_id": rec.device_id, "metrics": [], "raw": {}},
            )
            device["metrics"].append(
                {
                    "metric": rec.metric,
                    "value": rec.value,
                    "unit": rec.unit,
                    "quality": rec.quality,
                }
            )
            if self._config.include_raw_registers and rec.raw is not None:
                device.setdefault("raw", {})[rec.metric] = rec.raw
            elif not self._config.include_raw_registers:
                device.pop("raw", None)
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "devices": list(device_map.values()),
        }

    async def register_maps(self) -> dict[str, Any]:
        payload: list[dict[str, Any]] = []
        for device in self._devices:
            point_map_path = device.get("point_map")
            if not point_map_path:
                continue
            point_map = load_point_map(point_map_path)
            payload.append(
                {
                    "device_id": device["id"],
                    "make": device.get("make"),
                    "model": device.get("model"),
                    "protocol": device.get("protocol"),
                    "map": point_map.payload,
                    "hash": point_map.hash,
                }
            )
        return {"devices": payload}

    async def push_register_maps(self) -> None:
        if not self._config.enable:
            return
        payload = await self.register_maps()
        await self._client.post(
            str(self._config.registermap_url),
            headers={"Authorization": f"Bearer {self._config.auth_token}"},
            json=payload,
        )


__all__ = ["ExportService"]
