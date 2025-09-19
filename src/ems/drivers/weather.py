from __future__ import annotations

import random
from typing import Any, List

from ..utils.models import Measurement
from .base import BaseDriver
from .pointmap import load_point_map


class WeatherStationDriver(BaseDriver):
    def __init__(self, device_config: Any) -> None:
        super().__init__(device_config)
        if device_config.point_map is None:
            raise ValueError("Weather driver requires point_map")
        self.point_map = load_point_map(device_config.point_map)

    async def read_points(self) -> List[Measurement]:
        measurements: list[Measurement] = []
        for point in self.point_map.points:
            if point.get("parser") == "csv":
                value = random.uniform(0, 1000)
            else:
                value = random.uniform(0, 1)
            measurements.append(
                self._measurement(metric=point["name"], value=value, unit=point.get("unit"))
            )
        return measurements


__all__ = ["WeatherStationDriver"]
