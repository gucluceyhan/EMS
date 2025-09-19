from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class Quality(str, Enum):
    GOOD = "GOOD"
    BAD = "BAD"
    UNCERTAIN = "UNCERTAIN"


class Measurement(BaseModel):
    """Canonical measurement schema for the EMS."""

    timestamp_utc: datetime = Field(..., description="UTC timestamp of the measurement")
    plant_id: str
    device_id: str
    metric: str
    value: Optional[float] = None
    unit: Optional[str] = None
    quality: Quality = Quality.GOOD
    source: str = Field(..., description="Driver source identifier")
    raw: Optional[dict[str, Any]] = None

    class Config:
        frozen = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class ControlResult(BaseModel):
    accepted: bool
    message: str
    dry_run: bool
    executed_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class DeviceStatus(BaseModel):
    device_id: str
    type: str
    last_poll_utc: Optional[datetime]
    healthy: bool
    message: Optional[str]
    extra: dict[str, Any] = Field(default_factory=dict)
