"""Tests for enhanced profiles system"""
import pytest
from httpx import ASGITransport, AsyncClient

from ems.api.app import APIContext, create_app
from ems.core.health import HealthRegistry
from ems.store.database import Database
from ems.utils.config import AppConfig, DeviceType, ProtocolType, DeviceProfile, EnhancedCapabilities


class DummyExportService:
    async def snapshot(self, window_s: int = 60):
        return {"devices": []}

    async def register_maps(self):
        return {"devices": []}


def build_enhanced_config(tmp_path) -> AppConfig:
    """Build config with enhanced profiles support"""
    return AppConfig.model_validate({
        "version": 1,
        "plant": {"id": "test-plant", "name": "Test Plant", "timezone": "UTC"},
        "global": {
            "enable_control": False,
            "dry_run": True,
            "storage": {
                "sqlite_path": str(tmp_path / "db.sqlite"),
                "retention_days": 30,
                "export_parquet_dir": str(tmp_path / "exports"),
                "export_interval_s": 3600,
            },
            "uplink": {
                "url": "https://example.com",
                "api_key": "key",
                "batch_period_s": 300,
                "max_batch_kb": 256,
                "tls_verify": True,
            },
            "export": {
                "enable": False,
                "snapshot_url": "https://example.com/snapshot",
                "registermap_url": "https://example.com/maps",
                "auth_token": "token",
                "include_raw_registers": False,
            },
            "api": {"bind_host": "127.0.0.1", "port": 8080, "auth_token": "token"},
            "ui": {
                "enabled": True,
                "bind_host": "127.0.0.1",
                "port": 8080,
                "basic_auth_user": "user",
                "basic_auth_password": "pass",
            },
            "logging": {"level": "INFO", "json": True},
            "security": {"auth_token": "token"},
            "scheduler": {"jitter_seconds": 5, "watchdog_interval_s": 30},
            "profiles": {
                "enabled": True,
                "profiles_dir": "profiles",
                "pointmaps_dir": "pointmaps",
                "auto_discover_pointmaps": True
            },
            "protocol_defaults": {
                "modbus_tcp": {
                    "port": 502,
                    "timeout_ms": 3000,
                    "retries": 3,
                    "unit_id": 1
                }
            }
        },
        "devices": [],
        "profiles": [
            {
                "id": "test-inverter-profile",
                "name": "Test Inverter Profile",
                "description": "Test profile for inverters",
                "device_type": "inverter",
                "protocol": "modbus_tcp",
                "default_point_map": "pointmaps/sunspec_inverter_common.yaml",
                "poll_interval_s": 30,
                "capabilities": {
                    "set_active_power_limit": True,
                    "energy_measurement": True
                },
                "tags": ["test", "inverter"]
            }
        ]
    })


async def build_enhanced_context(tmp_path):
    """Build API context with enhanced profiles"""
    db = Database(str(tmp_path / "db.sqlite"))
    await db.connect()
    
    context = APIContext(
        config=build_enhanced_config(tmp_path),
        db=db,
        export_service=DummyExportService(),
        health=HealthRegistry(),
        device_status={},
        allow_control=False,
        dry_run=True,
    )
    return context, db


@pytest.mark.asyncio
async def test_device_types_endpoint(tmp_path):
    """Test device types API endpoint"""
    context, db = await build_enhanced_context(tmp_path)
    app = create_app(context)
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/device-types", headers={"Authorization": "Bearer token"})
            assert resp.status_code == 200
            
            data = resp.json()
            assert "device_types" in data
            assert len(data["device_types"]) > 0
            
            # Check first device type structure
            device_type = data["device_types"][0]
            assert "value" in device_type
            assert "label" in device_type
            assert "icon" in device_type
            
    finally:
        if db._engine is not None:
            await db._engine.dispose()


@pytest.mark.asyncio 
async def test_protocols_endpoint(tmp_path):
    """Test protocols API endpoint"""
    context, db = await build_enhanced_context(tmp_path)
    app = create_app(context)
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/protocols", headers={"Authorization": "Bearer token"})
            assert resp.status_code == 200
            
            data = resp.json()
            assert "protocols" in data
            assert len(data["protocols"]) > 0
            
            # Check for expected protocols
            protocol_values = [p["value"] for p in data["protocols"]]
            assert "modbus_tcp" in protocol_values
            assert "modbus_rtu" in protocol_values
            assert "mqtt" in protocol_values
            
    finally:
        if db._engine is not None:
            await db._engine.dispose()


@pytest.mark.asyncio
async def test_profiles_endpoint(tmp_path):
    """Test profiles API endpoint"""
    context, db = await build_enhanced_context(tmp_path)
    app = create_app(context)
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/profiles", headers={"Authorization": "Bearer token"})
            assert resp.status_code == 200
            
            data = resp.json()
            assert "profiles" in data
            assert len(data["profiles"]) >= 1  # Should have test profile
            
            # Check test profile
            test_profile = next((p for p in data["profiles"] if p["id"] == "test-inverter-profile"), None)
            assert test_profile is not None
            assert test_profile["name"] == "Test Inverter Profile"
            assert test_profile["device_type"] == "inverter"
            
    finally:
        if db._engine is not None:
            await db._engine.dispose()


@pytest.mark.asyncio
async def test_specific_profile_endpoint(tmp_path):
    """Test specific profile API endpoint"""
    context, db = await build_enhanced_context(tmp_path)
    app = create_app(context)
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Test existing profile
            resp = await client.get("/api/profiles/test-inverter-profile", headers={"Authorization": "Bearer token"})
            assert resp.status_code == 200
            
            profile = resp.json()
            assert profile["name"] == "Test Inverter Profile"
            assert profile["capabilities"]["set_active_power_limit"] is True
            
            # Test non-existent profile
            resp = await client.get("/api/profiles/non-existent", headers={"Authorization": "Bearer token"})
            assert resp.status_code == 404
            
    finally:
        if db._engine is not None:
            await db._engine.dispose()


@pytest.mark.asyncio
async def test_pointmaps_endpoint(tmp_path):
    """Test pointmaps API endpoint"""
    context, db = await build_enhanced_context(tmp_path)
    app = create_app(context)
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/pointmaps", headers={"Authorization": "Bearer token"})
            assert resp.status_code == 200
            
            data = resp.json()
            assert "pointmaps" in data
            # Note: This test may fail if pointmaps directory doesn't exist
            # but the API should still return an empty list
            
    finally:
        if db._engine is not None:
            await db._engine.dispose()


@pytest.mark.asyncio
async def test_protocol_defaults_endpoint(tmp_path):
    """Test protocol defaults API endpoint"""
    context, db = await build_enhanced_context(tmp_path)
    app = create_app(context)
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/protocol-defaults", headers={"Authorization": "Bearer token"})
            assert resp.status_code == 200
            
            data = resp.json()
            assert "protocol_defaults" in data
            
            # Check for modbus_tcp defaults
            defaults = data["protocol_defaults"]
            if "modbus_tcp" in defaults:
                modbus_tcp = defaults["modbus_tcp"]
                assert "port" in modbus_tcp
                assert "timeout_ms" in modbus_tcp
                assert "retries" in modbus_tcp
            
    finally:
        if db._engine is not None:
            await db._engine.dispose()


def test_device_type_enum():
    """Test DeviceType enum functionality"""
    # Test display names
    assert DeviceType.get_display_name("inverter") == "Solar Inverter"
    assert DeviceType.get_display_name("meter") == "Energy Meter"
    assert DeviceType.get_display_name("unknown") == "Unknown"
    
    # Test icons
    assert DeviceType.get_icon("inverter") == "⚡"
    assert DeviceType.get_icon("bms") == "🔋" 
    assert DeviceType.get_icon("unknown") == "📟"


def test_protocol_type_enum():
    """Test ProtocolType enum"""
    # Test enum values
    assert ProtocolType.MODBUS_TCP.value == "modbus_tcp"
    assert ProtocolType.RS485.value == "rs485"
    assert ProtocolType.MQTT.value == "mqtt"


def test_enhanced_capabilities_model():
    """Test EnhancedCapabilities model"""
    capabilities = EnhancedCapabilities()
    
    # Test default values
    assert capabilities.set_active_power_limit is False
    assert capabilities.energy_measurement is False
    assert capabilities.firmware_update is False
    
    # Test setting values
    capabilities.set_active_power_limit = True
    capabilities.energy_measurement = True
    
    assert capabilities.set_active_power_limit is True
    assert capabilities.energy_measurement is True


def test_device_profile_model():
    """Test DeviceProfile model"""
    profile = DeviceProfile(
        id="test-profile",
        name="Test Profile",
        description="Test Description",
        device_type=DeviceType.INVERTER,
        protocol=ProtocolType.MODBUS_TCP,
        poll_interval_s=30
    )
    
    assert profile.id == "test-profile"
    assert profile.name == "Test Profile"
    assert profile.device_type == DeviceType.INVERTER
    assert profile.protocol == ProtocolType.MODBUS_TCP
    assert profile.poll_interval_s == 30
    
    # Test JSON serialization
    data = profile.model_dump()
    assert data["device_type"] == "inverter"
    assert data["protocol"] == "modbus_tcp"
