from __future__ import annotations

from .generic_modbus import GenericModbusDriver


class SunSpecInverterDriver(GenericModbusDriver):
    """SunSpec inverter using the generic Modbus decoder."""

    pass


__all__ = ["SunSpecInverterDriver"]
