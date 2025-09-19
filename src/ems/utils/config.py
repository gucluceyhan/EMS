from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, MutableMapping

import yaml
from pydantic import BaseModel, Field, HttpUrl, validator

ENV_PREFIX = "EMS_"


class ControlCapabilities(BaseModel):
    set_active_power_limit: bool = False
    open_breaker: bool = False
    close_breaker: bool = False
    tracker_mode: bool = False

    class Config:
        extra = "allow"


class DeviceConfig(BaseModel):
    id: str
    plant_id: str
    type: str
    make: str
    model: str
    protocol: str
    connection: Dict[str, Any]
    poll_interval_s: int = 60
    timeout_ms: int = 2000
    retries: int = 3
    point_map: str | None = None
    control_capabilities: ControlCapabilities = Field(default_factory=ControlCapabilities)

    @validator("poll_interval_s")
    def _min_poll(cls, value: int) -> int:
        if value < 5:
            raise ValueError("poll_interval_s must be >= 5 seconds")
        return value


class UplinkConfig(BaseModel):
    url: HttpUrl
    api_key: str
    batch_period_s: int = 300
    max_batch_kb: int = 512
    tls_verify: bool = True


class ExportConfig(BaseModel):
    enable: bool = True
    snapshot_url: HttpUrl
    registermap_url: HttpUrl
    auth_token: str
    include_raw_registers: bool = False


class StorageConfig(BaseModel):
    sqlite_path: str
    retention_days: int = 30
    export_parquet_dir: str
    export_interval_s: int = 3600


class APIConfig(BaseModel):
    bind_host: str = "0.0.0.0"
    port: int = 8080
    auth_token: str


class UIConfig(BaseModel):
    enabled: bool = True
    bind_host: str = "0.0.0.0"
    port: int = 8080
    basic_auth_user: str
    basic_auth_password: str


class LoggingConfig(BaseModel):
    level: str = "INFO"
    json: bool = True


class SecurityConfig(BaseModel):
    auth_token: str


class SchedulerConfig(BaseModel):
    jitter_seconds: int = 5
    watchdog_interval_s: int = 30


class GlobalConfig(BaseModel):
    enable_control: bool = False
    dry_run: bool = True
    storage: StorageConfig
    uplink: UplinkConfig
    export: ExportConfig
    api: APIConfig
    ui: UIConfig
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    security: SecurityConfig
    scheduler: SchedulerConfig = Field(default_factory=SchedulerConfig)


class PlantConfig(BaseModel):
    id: str
    name: str
    timezone: str = "UTC"


class MQTTConfig(BaseModel):
    host: str = "localhost"
    port: int = 1883
    username: str | None = None
    password: str | None = None
    tls: bool = False


class CANConfig(BaseModel):
    interface: str = "can0"
    channel: str = "can0"
    bitrate: int = 250000


class AppConfig(BaseModel):
    version: int
    plant: PlantConfig
    global_: GlobalConfig = Field(alias="global")
    mqtt: MQTTConfig = Field(default_factory=MQTTConfig)
    can: CANConfig = Field(default_factory=CANConfig)
    devices: List[DeviceConfig]

    class Config:
        allow_population_by_field_name = True


def _parse_env_value(value: str) -> Any:
    lowered = value.lower()
    if lowered in {"true", "false"}:
        return lowered == "true"
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def _apply_env_overrides(data: MutableMapping[str, Any]) -> None:
    for key, value in os.environ.items():
        if not key.startswith(ENV_PREFIX):
            continue
        path = key[len(ENV_PREFIX) :].lower().split("__")
        cursor: MutableMapping[str, Any] = data
        for part in path[:-1]:
            if part not in cursor or not isinstance(cursor[part], MutableMapping):
                cursor[part] = {}
            cursor = cursor[part]
        cursor[path[-1]] = _parse_env_value(value)


def load_config(path: str | Path) -> AppConfig:
    raw_text = Path(path).read_text(encoding="utf-8")
    data = yaml.safe_load(raw_text)
    if not isinstance(data, dict):
        raise ValueError("Invalid config YAML structure")
    _apply_env_overrides(data)
    return AppConfig.model_validate(data)


__all__ = ["AppConfig", "DeviceConfig", "load_config"]
