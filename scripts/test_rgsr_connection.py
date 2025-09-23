#!/usr/bin/env python3
"""
Test script for RGSR RG20C Reactive Power Relay RS485 connection
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ems.io.modbus import create_client
from ems.drivers.pointmap import load_point_map

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def test_rgsr_connection():
    """Test RGSR RG20C connection via RS485"""
    
    # Connection configuration
    connection_config = {
        "serial_port": "/dev/ttyUSB0",  # Change this if your device is different
        "baudrate": 9600,
        "bytesize": 8,
        "parity": "N",
        "stopbits": 1,
        "timeout_ms": 5000,
        "unit_id": 1,  # Change this to match your device
    }
    
    logger.info("Testing RGSR RG20C Reactive Power Relay connection...")
    logger.info(f"Connection config: {connection_config}")
    
    try:
        # Create modbus RTU client
        client = create_client("modbus_rtu", connection_config)
        
        logger.info("Created Modbus RTU client")
        
        # Test basic voltage reading (VL1n at address 0)
        logger.info("Testing basic voltage reading (VL1n)...")
        voltage_registers = await client.read(fc=3, address=0, count=2)
        logger.info(f"VL1n raw registers: {voltage_registers}")
        
        # Convert float32 from registers (big endian)
        if len(voltage_registers) >= 2:
            # Combine two 16-bit registers into 32-bit float
            high_word = voltage_registers[0]
            low_word = voltage_registers[1]
            combined = (high_word << 16) | low_word
            voltage_bytes = combined.to_bytes(4, byteorder='big')
            import struct
            voltage_value = struct.unpack('>f', voltage_bytes)[0]
            logger.info(f"VL1n voltage: {voltage_value:.2f} V")
        
        # Test current reading (IL1 at address 14)
        logger.info("Testing current reading (IL1)...")
        current_registers = await client.read(fc=3, address=14, count=2)
        logger.info(f"IL1 raw registers: {current_registers}")
        
        if len(current_registers) >= 2:
            high_word = current_registers[0]
            low_word = current_registers[1]
            combined = (high_word << 16) | low_word
            current_bytes = combined.to_bytes(4, byteorder='big')
            current_value = struct.unpack('>f', current_bytes)[0] * 0.001  # Apply scale
            logger.info(f"IL1 current: {current_value:.3f} A")
        
        # Test frequency reading (at address 32)
        logger.info("Testing frequency reading...")
        freq_registers = await client.read(fc=3, address=32, count=2)
        logger.info(f"Frequency raw registers: {freq_registers}")
        
        if len(freq_registers) >= 2:
            high_word = freq_registers[0]
            low_word = freq_registers[1]
            combined = (high_word << 16) | low_word
            freq_bytes = combined.to_bytes(4, byteorder='big')
            freq_value = struct.unpack('>f', freq_bytes)[0]
            logger.info(f"Frequency: {freq_value:.2f} Hz")
        
        # Test reactive power reading (SUM_Q at address 64)
        logger.info("Testing reactive power reading...")
        reactive_registers = await client.read(fc=3, address=64, count=2)
        logger.info(f"Q_Total raw registers: {reactive_registers}")
        
        if len(reactive_registers) >= 2:
            high_word = reactive_registers[0]
            low_word = reactive_registers[1]
            combined = (high_word << 16) | low_word
            reactive_bytes = combined.to_bytes(4, byteorder='big')
            reactive_value = struct.unpack('>f', reactive_bytes)[0] * 0.001  # Apply scale
            logger.info(f"Q_Total: {reactive_value:.3f} kVar")
        
        # Test power factor reading (PF at address 134)
        logger.info("Testing power factor reading...")
        pf_registers = await client.read(fc=3, address=134, count=2)
        logger.info(f"Power factor raw registers: {pf_registers}")
        
        if len(pf_registers) >= 2:
            high_word = pf_registers[0]
            low_word = pf_registers[1]
            combined = (high_word << 16) | low_word
            pf_bytes = combined.to_bytes(4, byteorder='big')
            pf_value = struct.unpack('>f', pf_bytes)[0]
            logger.info(f"Power factor: {pf_value:.3f}")
        
        # Test reactive power control stage 1 (at address 10240)
        logger.info("Testing reactive power control stage 1...")
        stage1_registers = await client.read(fc=3, address=10240, count=2)
        logger.info(f"Stage 1 raw registers: {stage1_registers}")
        
        if len(stage1_registers) >= 2:
            high_word = stage1_registers[0]
            low_word = stage1_registers[1]
            combined = (high_word << 16) | low_word
            stage1_bytes = combined.to_bytes(4, byteorder='big')
            stage1_value = struct.unpack('>f', stage1_bytes)[0]
            logger.info(f"Stage 1 power: {stage1_value:.1f} VAr")
        
        await client.close()
        logger.info("✅ RGSR connection test completed successfully!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ RGSR connection test failed: {e}")
        logger.info("This is expected if:")
        logger.info("1. RS485 converter is not connected to /dev/ttyUSB0")
        logger.info("2. RGSR device is not connected or powered")
        logger.info("3. Device has different unit ID or communication settings")
        logger.info("4. pymodbus library is not installed")
        return False


async def test_with_point_map():
    """Test RGSR using the point map"""
    
    logger.info("Testing RGSR with EMS point map...")
    
    try:
        # Load the point map
        point_map_path = Path(__file__).parent.parent / "pointmaps" / "rg20c_ems_format.yaml"
        point_map = load_point_map(point_map_path)
        
        logger.info(f"Loaded point map: {point_map.metadata}")
        logger.info(f"Points count: {len(point_map.points)}")
        
        # Show some key points
        key_points = ["VL1n", "IL1", "Frequency", "P_Total", "Q_Total", "PF_Total"]
        logger.info("Key measurement points:")
        for point in point_map.points:
            if point.get("name") in key_points:
                logger.info(f"  {point['name']}: FC={point['fc']}, Addr={point['address']}, Unit={point.get('unit', 'N/A')}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Point map test failed: {e}")
        return False


def show_connection_help():
    """Show help for RS485 connection"""
    
    print("\n" + "="*60)
    print("🔌 RGSR RG20C RS485 Connection Setup")
    print("="*60)
    print()
    print("Hardware Requirements:")
    print("  • RS485 to USB converter (FTDI, CH340, CP210x, etc.)")
    print("  • RS485 A+/B- connection to RGSR device")
    print("  • 120Ω termination resistor if needed")
    print("  • Power supply for RGSR device")
    print()
    print("Connection Settings:")
    print("  • Baud Rate: 9600")
    print("  • Data Bits: 8")
    print("  • Parity: None (N)")
    print("  • Stop Bits: 1")
    print("  • Unit ID: 1 (check RGSR manual)")
    print()
    print("Device Detection:")
    print("  macOS:")
    print("    ls /dev/cu.usbserial-*")
    print("    ls /dev/cu.SLAB_USBtoUART*")
    print("  Linux:")
    print("    ls /dev/ttyUSB*")
    print("    dmesg | grep tty")
    print()
    print("To test connection:")
    print("  1. Connect RS485 converter to USB")
    print("  2. Connect A+/B- wires to RGSR device")
    print("  3. Power on RGSR device")
    print("  4. Update serial_port in config.yaml")
    print("  5. Run: python scripts/test_rgsr_connection.py")
    print()
    print("="*60)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        show_connection_help()
        sys.exit(0)
    
    print("🔌 RGSR RG20C Reactive Power Relay Test")
    print("=" * 50)
    
    # Run connection test
    connection_success = asyncio.run(test_rgsr_connection())
    
    # Run point map test
    pointmap_success = asyncio.run(test_with_point_map())
    
    if connection_success and pointmap_success:
        print("\n✅ All tests passed!")
        print("Your RGSR device is ready for EMS integration")
    else:
        print("\n⚠️  Some tests failed")
        print("Run with --help for connection setup guide")
        show_connection_help()
    
    print("\nNext steps:")
    print("1. Ensure RS485 converter is connected")
    print("2. Update serial_port in config.yaml if needed")
    print("3. Restart EMS: sudo systemctl restart ems")
    print("4. Check device status: curl http://127.0.0.1:8083/devices")
