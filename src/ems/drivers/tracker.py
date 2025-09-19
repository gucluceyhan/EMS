from __future__ import annotations

from typing import List

from ..utils.models import Measurement
from .generic_modbus import GenericModbusDriver


class TrackerDriver(GenericModbusDriver):
    async def read_points(self) -> List[Measurement]:
        return await super().read_points()


__all__ = ["TrackerDriver"]
