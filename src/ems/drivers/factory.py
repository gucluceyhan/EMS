from __future__ import annotations

from typing import Dict, Type

from ..utils.config import DeviceConfig
from .base import BaseDriver
from .bms_mqtt import MQTTBMSDriver
from .dio import DIOExpanderDriver
from .generic_modbus import GenericModbusDriver
from .inverter_sunspec import SunSpecInverterDriver
from .meter import IECMeterDriver
from .tracker import TrackerDriver
from .weather import WeatherStationDriver

DRIVER_MAP: Dict[str, Type[BaseDriver]] = {
    "inverter": SunSpecInverterDriver,
    "meter": IECMeterDriver,
    "weather": WeatherStationDriver,
    "tracker": TrackerDriver,
    "bms": MQTTBMSDriver,
    "dio": DIOExpanderDriver,
    "generic_modbus": GenericModbusDriver,
    "power_analyzer": GenericModbusDriver,  # Power analyzers, reactive power relays (RG20C, etc.)
}


def create_driver(config: DeviceConfig) -> BaseDriver:
    driver_cls = DRIVER_MAP.get(config.type)
    if driver_cls is None:
        raise ValueError(f"Unsupported device type {config.type}")
    return driver_cls(config)


__all__ = ["create_driver"]
