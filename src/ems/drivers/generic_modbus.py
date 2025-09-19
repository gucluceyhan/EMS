from __future__ import annotations

import struct
from typing import Any, Dict, List

from ..io.modbus import ModbusClientProtocol, create_client
from ..utils.models import Measurement, Quality
from .base import BaseDriver
from .pointmap import PointMap, load_point_map


class GenericModbusDriver(BaseDriver):
    def __init__(self, device_config: Any, client: ModbusClientProtocol | None = None) -> None:
        super().__init__(device_config)
        if device_config.point_map is None:
            raise ValueError("Generic Modbus device requires point_map")
        self.point_map: PointMap = load_point_map(device_config.point_map)
        self.client = client or create_client(device_config.protocol, device_config.connection)

    async def read_points(self) -> List[Measurement]:
        measurements: list[Measurement] = []
        for point in self.point_map.points:
            fc = int(point.get("fc", 3))
            address = int(point.get("address"))
            count = int(point.get("count", 1))
            registers = await self.client.read(fc=fc, address=address, count=count)
            value, quality = self._decode_point(point, registers)
            measurements.append(
                self._measurement(
                    metric=point["name"],
                    value=value,
                    unit=point.get("unit"),
                    quality=quality,
                    raw={"registers": registers},
                )
            )
        return measurements

    def _decode_point(
        self, point: Dict[str, Any], registers: List[int]
    ) -> tuple[float | None, Quality]:
        ptype = point.get("type", "uint16")
        scale = float(point.get("scale", 1.0))
        value: float | None
        byte_order = point.get("word_order", "big")
        endianness = point.get("endianness", "big")
        regs = list(registers)
        if len(regs) > 1 and byte_order == "little":
            regs = list(reversed(regs))
        if ptype == "bool":
            value = float(regs[0])
        elif ptype == "uint16":
            value = float(regs[0])
        elif ptype == "int16":
            value = float(
                struct.unpack(
                    ">h" if endianness == "big" else "<h", regs[0].to_bytes(2, endianness)
                )[0]
            )
        elif ptype in {"uint32", "int32", "float"}:
            raw_bytes = b"".join(r.to_bytes(2, endianness) for r in regs)
            if ptype == "float":
                fmt = ">f" if endianness == "big" else "<f"
                value = float(struct.unpack(fmt, raw_bytes)[0])
            elif ptype == "uint32":
                value = float(int.from_bytes(raw_bytes, endianness, signed=False))
            else:
                value = float(int.from_bytes(raw_bytes, endianness, signed=True))
        elif ptype.startswith("bitfield"):
            value = float(registers[0])
        else:
            value = float(registers[0])
        value *= scale
        quality = Quality.GOOD
        rules = point.get("quality_rules")
        if rules:
            min_v = rules.get("min")
            max_v = rules.get("max")
            if min_v is not None and value < float(min_v):
                quality = Quality.BAD
            if max_v is not None and value > float(max_v):
                quality = Quality.BAD
        return value, quality


__all__ = ["GenericModbusDriver"]
