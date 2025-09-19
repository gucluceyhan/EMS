from __future__ import annotations

import random
from typing import Protocol


class ModbusClientProtocol(Protocol):
    async def read(self, fc: int, address: int, count: int) -> list[int]: ...


class SimulatedModbusClient(ModbusClientProtocol):
    async def read(self, fc: int, address: int, count: int) -> list[int]:
        random.seed(address + count + fc)
        return [random.randint(0, 65535) for _ in range(count)]


def create_client(protocol: str, connection: dict[str, object]) -> ModbusClientProtocol:
    # In production this would create TCP/RTU clients. The sample uses a simulator.
    return SimulatedModbusClient()


__all__ = ["ModbusClientProtocol", "create_client", "SimulatedModbusClient"]
