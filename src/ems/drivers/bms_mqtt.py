from __future__ import annotations

import random
from typing import Any, Dict, List

from ..utils.models import ControlResult, Measurement
from .base import BaseDriver, ControlNotAllowedError
from .pointmap import load_point_map


class MQTTBMSDriver(BaseDriver):
    def __init__(self, device_config: Any) -> None:
        super().__init__(device_config)
        if device_config.point_map is None:
            raise ValueError("BMS driver requires point_map")
        self.point_map = load_point_map(device_config.point_map)
        self._last_payload: Dict[str, Any] = {}

    async def read_points(self) -> List[Measurement]:
        measurements: list[Measurement] = []
        values = {
            "SOC": random.uniform(20, 95),
            "PACK_V": random.uniform(600, 850),
            "PACK_I": random.uniform(-100, 100),
            "ALARM_COUNT": random.randint(0, 3),
        }
        for point in self.point_map.points:
            metric = point["metric"]
            unit = point.get("unit")
            value = float(values.get(metric, 0.0))
            measurements.append(self._measurement(metric=metric, value=value, unit=unit))
        self._last_payload = values
        return measurements

    async def apply_control(self, command: str, value: Any | None = None) -> ControlResult:
        raise ControlNotAllowedError("BMS controls are disabled by default")

    async def health(self) -> dict[str, Any]:
        return {"last_payload": self._last_payload}


__all__ = ["MQTTBMSDriver"]
