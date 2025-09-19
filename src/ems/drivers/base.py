from __future__ import annotations

import abc
from datetime import datetime, timezone
from typing import Any, List

from ..utils.models import ControlResult, Measurement, Quality


class DriverError(Exception):
    pass


class ControlNotAllowedError(DriverError):
    pass


class BaseDriver(abc.ABC):
    def __init__(self, device_config: Any) -> None:
        self.device_config = device_config
        self.device_id = device_config.id
        self.plant_id = device_config.plant_id
        self.type = device_config.type

    @abc.abstractmethod
    async def read_points(self) -> List[Measurement]:
        raise NotImplementedError

    async def apply_control(self, command: str, value: Any | None = None) -> ControlResult:
        raise ControlNotAllowedError(f"Device {self.device_id} does not accept controls")

    async def health(self) -> dict[str, Any]:
        return {"status": "OK"}

    def _measurement(
        self,
        metric: str,
        value: float | None,
        unit: str | None,
        quality: Quality = Quality.GOOD,
        raw: dict[str, Any] | None = None,
    ) -> Measurement:
        return Measurement(
            timestamp_utc=datetime.now(timezone.utc),
            plant_id=self.plant_id,
            device_id=self.device_id,
            metric=metric,
            value=value,
            unit=unit,
            quality=quality,
            source=self.__class__.__name__,
            raw=raw,
        )


__all__ = ["BaseDriver", "DriverError", "ControlNotAllowedError"]
