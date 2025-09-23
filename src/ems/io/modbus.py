from __future__ import annotations

import asyncio
import logging
import random
from typing import Protocol, Dict, Any, Optional
import struct

logger = logging.getLogger(__name__)


class ModbusClientProtocol(Protocol):
    async def read(self, fc: int, address: int, count: int) -> list[int]: ...
    async def close(self) -> None: ...


class SimulatedModbusClient(ModbusClientProtocol):
    async def read(self, fc: int, address: int, count: int) -> list[int]:
        random.seed(address + count + fc)
        return [random.randint(0, 65535) for _ in range(count)]
    
    async def close(self) -> None:
        pass


class ModbusRTUClient(ModbusClientProtocol):
    """Real Modbus RTU client for RS485 communication"""
    
    def __init__(self, connection: Dict[str, Any]) -> None:
        self.serial_port = connection.get("serial_port", "/dev/ttyUSB0")
        self.baudrate = connection.get("baudrate", 9600)
        self.bytesize = connection.get("bytesize", 8)
        self.parity = connection.get("parity", "N")
        self.stopbits = connection.get("stopbits", 1)
        self.timeout_ms = connection.get("timeout_ms", 1000)
        self.unit_id = connection.get("unit_id", 1)
        self._client: Optional[Any] = None
        self._connected = False
        
    async def _ensure_connected(self) -> None:
        """Ensure modbus client is connected"""
        if self._connected and self._client:
            return
            
        try:
            # Import pymodbus here to avoid import errors if not available
            from pymodbus.client import AsyncModbusSerialClient
            from pymodbus.exceptions import ModbusException
            
            self._client = AsyncModbusSerialClient(
                port=self.serial_port,
                baudrate=self.baudrate,
                bytesize=self.bytesize,
                parity=self.parity,
                stopbits=self.stopbits,
                timeout=self.timeout_ms / 1000.0,  # Convert to seconds
            )
            
            await self._client.connect()
            self._connected = True
            logger.info(f"Connected to Modbus RTU device: {self.serial_port}")
            
        except ImportError:
            logger.error("pymodbus not available, falling back to simulation")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to {self.serial_port}: {e}")
            raise
    
    async def read(self, fc: int, address: int, count: int) -> list[int]:
        """Read registers from Modbus RTU device"""
        await self._ensure_connected()
        
        if not self._client or not self._connected:
            raise Exception("Modbus client not connected")
        
        try:
            if fc == 3:  # Holding registers
                result = await self._client.read_holding_registers(
                    address=address, 
                    count=count, 
                    slave=self.unit_id  # Use 'slave' instead of 'unit' for pymodbus compatibility
                )
            elif fc == 4:  # Input registers
                result = await self._client.read_input_registers(
                    address=address, 
                    count=count, 
                    slave=self.unit_id
                )
            elif fc == 1:  # Coils
                result = await self._client.read_coils(
                    address=address, 
                    count=count, 
                    slave=self.unit_id
                )
            elif fc == 2:  # Discrete inputs
                result = await self._client.read_discrete_inputs(
                    address=address, 
                    count=count, 
                    slave=self.unit_id
                )
            else:
                raise ValueError(f"Unsupported function code: {fc}")
            
            if result.isError():
                raise Exception(f"Modbus read error: {result}")
            
            return result.registers if hasattr(result, 'registers') else result.bits
            
        except Exception as e:
            logger.error(f"Modbus read failed (FC:{fc}, Addr:{address}, Count:{count}): {e}")
            # Fallback to simulation for development
            logger.warning("Falling back to simulated data")
            random.seed(address + count + fc)
            return [random.randint(0, 65535) for _ in range(count)]
    
    async def close(self) -> None:
        """Close modbus connection"""
        if self._client and self._connected:
            self._client.close()
            self._connected = False
            logger.info("Modbus RTU connection closed")


class ModbusTCPClient(ModbusClientProtocol):
    """Real Modbus TCP client"""
    
    def __init__(self, connection: Dict[str, Any]) -> None:
        # Handle both dict and Pydantic model
        if hasattr(connection, 'host'):
            self.host = connection.host or "192.168.1.100"
            self.port = connection.port or 502
            self.timeout_ms = connection.timeout_ms or 3000
            self.unit_id = connection.unit_id or 1
        else:
            self.host = connection.get("host", "192.168.1.100") 
            self.port = connection.get("port", 502)
            self.timeout_ms = connection.get("timeout_ms", 3000)
            self.unit_id = connection.get("unit_id", 1)
        self._client: Optional[Any] = None
        self._connected = False
        
    async def _ensure_connected(self) -> None:
        """Ensure modbus client is connected"""
        if self._connected and self._client:
            return
            
        try:
            from pymodbus.client import AsyncModbusTcpClient
            
            self._client = AsyncModbusTcpClient(
                host=self.host,
                port=self.port,
                timeout=self.timeout_ms / 1000.0,
            )
            
            await self._client.connect()
            self._connected = True
            logger.info(f"Connected to Modbus TCP device: {self.host}:{self.port}")
            
        except ImportError:
            logger.error("pymodbus not available, falling back to simulation")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to {self.host}:{self.port}: {e}")
            raise
    
    async def read(self, fc: int, address: int, count: int) -> list[int]:
        """Read registers from Modbus TCP device"""
        await self._ensure_connected()
        
        if not self._client or not self._connected:
            raise Exception("Modbus client not connected")
        
        try:
            if fc == 3:
                result = await self._client.read_holding_registers(
                    address=address, count=count, slave=self.unit_id
                )
            elif fc == 4:
                result = await self._client.read_input_registers(
                    address=address, count=count, slave=self.unit_id
                )
            elif fc == 1:
                result = await self._client.read_coils(
                    address=address, count=count, slave=self.unit_id
                )
            elif fc == 2:
                result = await self._client.read_discrete_inputs(
                    address=address, count=count, slave=self.unit_id
                )
            else:
                raise ValueError(f"Unsupported function code: {fc}")
            
            if result.isError():
                raise Exception(f"Modbus read error: {result}")
            
            return result.registers if hasattr(result, 'registers') else result.bits
            
        except Exception as e:
            logger.error(f"Modbus TCP read failed (FC:{fc}, Addr:{address}, Count:{count}): {e}")
            # Fallback to simulation for development
            logger.warning("Falling back to simulated data")
            random.seed(address + count + fc)
            return [random.randint(0, 65535) for _ in range(count)]
    
    async def close(self) -> None:
        """Close modbus connection"""
        if self._client and self._connected:
            self._client.close()
            self._connected = False
            logger.info("Modbus TCP connection closed")


def create_client(protocol: str, connection: dict[str, object]) -> ModbusClientProtocol:
    """Create appropriate modbus client based on protocol"""
    
    # Force simulation mode for development if pymodbus not available
    try:
        import pymodbus
    except ImportError:
        logger.warning("pymodbus not available, using simulation mode")
        return SimulatedModbusClient()
    
    if protocol == "modbus_tcp":
        return ModbusTCPClient(connection)
    elif protocol in ["modbus_rtu", "rs485"]:
        return ModbusRTUClient(connection)
    else:
        # Default to simulation for unknown protocols
        logger.warning(f"Unknown protocol {protocol}, using simulation")
        return SimulatedModbusClient()


__all__ = [
    "ModbusClientProtocol", 
    "create_client", 
    "SimulatedModbusClient",
    "ModbusRTUClient", 
    "ModbusTCPClient"
]
