from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List

from ..utils.models import ControlResult, Measurement
from .base import BaseDriver, ControlNotAllowedError


class DIOExpanderDriver(BaseDriver):
    async def read_points(self) -> List[Measurement]:
        return [
            self._measurement("DIGITAL_IN_1", value=1.0, unit=None),
            self._measurement("DIGITAL_OUT_1", value=0.0, unit=None),
        ]

    async def apply_control(self, command: str, value: Any | None = None) -> ControlResult:
        if command not in {"set_output"}:
            raise ControlNotAllowedError(f"Unsupported command {command}")
        return ControlResult(
            accepted=True,
            message="dry-run" if value is None else f"Output set to {value}",
            dry_run=True,
            executed_at=datetime.now(timezone.utc),
        )


__all__ = ["DIOExpanderDriver"]
