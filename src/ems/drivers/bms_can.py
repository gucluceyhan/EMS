from __future__ import annotations

from typing import List

from ..utils.models import Measurement
from .base import BaseDriver


class CANBMSDriver(BaseDriver):
    async def read_points(self) -> List[Measurement]:
        return []


__all__ = ["CANBMSDriver"]
