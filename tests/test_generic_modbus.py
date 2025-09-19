import pytest

from ems.drivers.generic_modbus import GenericModbusDriver
from ems.io.modbus import ModbusClientProtocol
from ems.utils.config import DeviceConfig


class DummyClient(ModbusClientProtocol):
    def __init__(self, responses):
        self.responses = responses

    async def read(self, fc: int, address: int, count: int) -> list[int]:  # type: ignore[override]
        return self.responses[(fc, address, count)]


@pytest.mark.asyncio
async def test_generic_modbus_decoding(tmp_path):
    pointmap = tmp_path / "map.yaml"
    pointmap.write_text(
        """
metadata:
  name: test
points:
  - name: VAL
    fc: 3
    address: 1
    type: int16
    count: 1
    scale: 0.1
  - name: BOOL
    fc: 1
    address: 2
    type: bool
    count: 1
"""
    )
    device_config = DeviceConfig.model_validate(
        {
            "id": "dev1",
            "plant_id": "plant",
            "type": "generic_modbus",
            "make": "X",
            "model": "Y",
            "protocol": "modbus_tcp",
            "connection": {},
            "point_map": str(pointmap),
        }
    )
    client = DummyClient({(3, 1, 1): [100], (1, 2, 1): [1]})
    driver = GenericModbusDriver(device_config, client=client)
    measurements = await driver.read_points()
    assert measurements[0].value == pytest.approx(10.0)
    assert measurements[1].value == 1.0
