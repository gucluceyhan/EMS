from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, MutableMapping, Optional
from enum import Enum

import yaml
from pydantic import BaseModel, Field, HttpUrl, validator

ENV_PREFIX = "EMS_"


class DeviceType(str, Enum):
    """Supported device types with their display names"""
    INVERTER = "inverter"
    ENERGY_METER = "meter" 
    WEATHER_STATION = "weather"
    SOLAR_TRACKER = "tracker"
    BMS = "bms"
    SMART_BREAKER = "breaker"
    FACILITY_MONITOR = "facility"
    SECURITY_SYSTEM = "security"
    POWER_ANALYZER = "power_analyzer"
    STRING_MONITOR = "string_monitor"
    TRANSFORMER_MONITOR = "transformer"
    SCADA_GATEWAY = "scada_gateway"
    GENERIC_MODBUS = "generic_modbus"
    DIO_EXPANDER = "dio"

    @classmethod
    def get_display_name(cls, device_type: str) -> str:
        """Get human-readable display name for device type"""
        display_names = {
            cls.INVERTER: "Solar Inverter",
            cls.ENERGY_METER: "Energy Meter",
            cls.WEATHER_STATION: "Weather Station", 
            cls.SOLAR_TRACKER: "Solar Tracker",
            cls.BMS: "Battery Management System",
            cls.SMART_BREAKER: "Smart Breaker",
            cls.FACILITY_MONITOR: "Facility Monitor",
            cls.SECURITY_SYSTEM: "Security System",
            cls.POWER_ANALYZER: "Power Quality Analyzer",
            cls.STRING_MONITOR: "String Monitor",
            cls.TRANSFORMER_MONITOR: "Transformer Monitor",
            cls.SCADA_GATEWAY: "SCADA Gateway",
            cls.GENERIC_MODBUS: "Generic Modbus Device",
            cls.DIO_EXPANDER: "Digital I/O Expander"
        }
        return display_names.get(device_type, device_type.replace("_", " ").title())

    @classmethod
    def get_icon(cls, device_type: str) -> str:
        """Get icon for device type"""
        icons = {
            cls.INVERTER: "⚡",
            cls.ENERGY_METER: "📊", 
            cls.WEATHER_STATION: "🌤",
            cls.SOLAR_TRACKER: "🎯",
            cls.BMS: "🔋",
            cls.SMART_BREAKER: "🔌",
            cls.FACILITY_MONITOR: "🏭",
            cls.SECURITY_SYSTEM: "🔒",
            cls.POWER_ANALYZER: "📈",
            cls.STRING_MONITOR: "🔗",
            cls.TRANSFORMER_MONITOR: "⚡",
            cls.SCADA_GATEWAY: "🌐",
            cls.GENERIC_MODBUS: "📡",
            cls.DIO_EXPANDER: "🎛"
        }
        return icons.get(device_type, "📟")


class ProtocolType(str, Enum):
    """Supported communication protocols"""
    MODBUS_TCP = "modbus_tcp"
    MODBUS_RTU = "modbus_rtu"
    MODBUS_ASCII = "modbus_ascii"
    MQTT = "mqtt"
    CAN_BUS = "can"
    SERIAL = "serial"
    RS485 = "rs485"
    HTTP_REST = "http_rest"
    SNMP = "snmp"
    BACNET = "bacnet"
    OPCUA = "opcua"
    IEC104 = "iec104"
    DNP3 = "dnp3"


class EnhancedCapabilities(BaseModel):
    """Enhanced device capabilities organized by category"""
    
    # Power Control
    set_active_power_limit: bool = False
    set_reactive_power_limit: bool = False
    power_factor_control: bool = False
    frequency_response: bool = False
    voltage_regulation: bool = False
    
    # Breaker/Switch Control
    open_breaker: bool = False
    close_breaker: bool = False
    emergency_stop: bool = False
    remote_reset: bool = False
    
    # Tracker Control
    tracker_position_control: bool = False
    tracker_stow_mode: bool = False
    tracker_calibration: bool = False
    
    # BMS Control
    battery_charge_control: bool = False
    battery_discharge_control: bool = False
    cell_balancing: bool = False
    thermal_management: bool = False
    
    # Security Control
    arm_disarm_system: bool = False
    camera_control: bool = False
    door_lock_control: bool = False
    alarm_acknowledge: bool = False
    
    # Monitoring Capabilities
    energy_measurement: bool = False
    power_quality_analysis: bool = False
    harmonic_analysis: bool = False
    fault_detection: bool = False
    predictive_maintenance: bool = False
    
    # Communication Features
    time_synchronization: bool = False
    firmware_update: bool = False
    configuration_backup: bool = False
    event_logging: bool = False

    class Config:
        extra = "allow"


class ProtocolConnectionConfig(BaseModel):
    """Protocol-specific connection configuration"""
    
    # Common fields
    timeout_ms: int = 3000
    retries: int = 3
    
    # TCP/Ethernet
    host: Optional[str] = None
    port: Optional[int] = None
    
    # Serial/RTU
    serial_port: Optional[str] = None
    baudrate: Optional[int] = 9600
    bytesize: Optional[int] = 8
    parity: Optional[str] = "N"  # N, E, O
    stopbits: Optional[int] = 1
    flow_control: Optional[bool] = False
    
    # Modbus specific
    unit_id: Optional[int] = 1
    word_order: Optional[str] = "big"  # big, little
    byte_order: Optional[str] = "big"  # big, little
    
    # MQTT specific
    topic_prefix: Optional[str] = None
    client_id: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    qos: Optional[int] = 1
    retain: Optional[bool] = False
    
    # CAN specific
    interface: Optional[str] = "can0"
    bitrate: Optional[int] = 250000
    can_id: Optional[int] = None
    
    # HTTP specific
    base_url: Optional[str] = None
    auth_type: Optional[str] = None  # basic, bearer, api_key
    auth_token: Optional[str] = None
    
    # Advanced options
    keep_alive: Optional[bool] = True
    connect_timeout: Optional[int] = 5000
    read_timeout: Optional[int] = 10000
    
    class Config:
        extra = "allow"


class ControlCapabilities(BaseModel):
    """Legacy control capabilities for backward compatibility"""
    set_active_power_limit: bool = False
    open_breaker: bool = False
    close_breaker: bool = False
    tracker_mode: bool = False

    class Config:
        extra = "allow"


class DeviceProfile(BaseModel):
    """Device profile template for creating devices"""
    id: str
    name: str
    description: str
    device_type: DeviceType
    protocol: ProtocolType
    default_connection: ProtocolConnectionConfig = Field(default_factory=ProtocolConnectionConfig)
    default_point_map: Optional[str] = None
    poll_interval_s: int = 60
    capabilities: EnhancedCapabilities = Field(default_factory=EnhancedCapabilities)
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        extra = "allow"


class DeviceConfig(BaseModel):
    id: str
    plant_id: str
    type: DeviceType  # Changed from str to DeviceType enum
    make: str
    model: str
    protocol: ProtocolType  # Changed from str to ProtocolType enum 
    connection: ProtocolConnectionConfig = Field(default_factory=ProtocolConnectionConfig)  # Enhanced connection config
    poll_interval_s: int = 60
    timeout_ms: int = 2000  # Kept for backward compatibility
    retries: int = 3  # Kept for backward compatibility
    point_map: str | None = None
    control_capabilities: ControlCapabilities = Field(default_factory=ControlCapabilities)  # Legacy
    capabilities: EnhancedCapabilities = Field(default_factory=EnhancedCapabilities)  # New enhanced capabilities
    profile_id: Optional[str] = None  # Reference to device profile
    custom_config: Dict[str, Any] = Field(default_factory=dict)  # Custom device-specific settings

    @validator("poll_interval_s")
    def _min_poll(cls, value: int) -> int:
        if value < 5:
            raise ValueError("poll_interval_s must be >= 5 seconds")
        return value
    
    @validator("timeout_ms", pre=True)
    def _sync_timeout(cls, value: int, values: Dict[str, Any]) -> int:
        """Sync timeout_ms with connection.timeout_ms if available"""
        if "connection" in values and hasattr(values["connection"], "timeout_ms"):
            values["connection"].timeout_ms = value
        return value
    
    @validator("retries", pre=True) 
    def _sync_retries(cls, value: int, values: Dict[str, Any]) -> int:
        """Sync retries with connection.retries if available"""
        if "connection" in values and hasattr(values["connection"], "retries"):
            values["connection"].retries = value
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


class ProfilesConfig(BaseModel):
    """Configuration for device profiles management"""
    enabled: bool = True
    profiles_dir: str = "profiles"
    pointmaps_dir: str = "pointmaps"
    auto_discover_pointmaps: bool = True
    default_profiles: List[str] = Field(default_factory=lambda: [
        "sunspec_inverter",
        "iec_meter", 
        "weather_station",
        "bms_mqtt",
        "generic_modbus"
    ])


class ProtocolDefaultsConfig(BaseModel):
    """Global default protocol configurations"""
    modbus_tcp: ProtocolConnectionConfig = Field(default_factory=lambda: ProtocolConnectionConfig(
        port=502,
        timeout_ms=3000,
        retries=3,
        unit_id=1
    ))
    
    modbus_rtu: ProtocolConnectionConfig = Field(default_factory=lambda: ProtocolConnectionConfig(
        baudrate=9600,
        bytesize=8,
        parity="N",
        stopbits=1,
        timeout_ms=5000,
        retries=3,
        unit_id=1
    ))
    
    rs485: ProtocolConnectionConfig = Field(default_factory=lambda: ProtocolConnectionConfig(
        baudrate=9600,
        bytesize=8,
        parity="N", 
        stopbits=1,
        timeout_ms=5000,
        retries=3
    ))
    
    mqtt: ProtocolConnectionConfig = Field(default_factory=lambda: ProtocolConnectionConfig(
        port=1883,
        timeout_ms=10000,
        retries=3,
        qos=1,
        retain=False
    ))
    
    can: ProtocolConnectionConfig = Field(default_factory=lambda: ProtocolConnectionConfig(
        interface="can0",
        bitrate=250000,
        timeout_ms=1000,
        retries=3
    ))
    
    serial: ProtocolConnectionConfig = Field(default_factory=lambda: ProtocolConnectionConfig(
        baudrate=9600,
        bytesize=8,
        parity="N",
        stopbits=1,
        timeout_ms=2000,
        retries=3
    ))


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
    profiles: ProfilesConfig = Field(default_factory=ProfilesConfig)  # New profiles config
    protocol_defaults: ProtocolDefaultsConfig = Field(default_factory=ProtocolDefaultsConfig)  # New protocol defaults


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
    profiles: List[DeviceProfile] = Field(default_factory=list)  # Device profiles list

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


__all__ = [
    "AppConfig", 
    "DeviceConfig", 
    "DeviceProfile",
    "DeviceType",
    "ProtocolType", 
    "EnhancedCapabilities",
    "ProtocolConnectionConfig",
    "ProfilesConfig",
    "ProtocolDefaultsConfig",
    "load_config"
]
