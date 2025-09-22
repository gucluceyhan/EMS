"""Device management API endpoints."""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from .audit import AuditLogger
from ..utils.config import DeviceConfig


class DeviceCreateRequest(BaseModel):
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
    overrides: Dict[str, Any] = {}


class DeviceUpdateRequest(BaseModel):
    make: str | None = None
    model: str | None = None
    connection: Dict[str, Any] | None = None
    poll_interval_s: int | None = None
    timeout_ms: int | None = None
    retries: int | None = None
    overrides: Dict[str, Any] | None = None


router = APIRouter(prefix="/api/devices", tags=["devices"])
audit_logger = AuditLogger()


def get_current_user(request: Request) -> str:
    # Mock user extraction from session/token
    return request.headers.get("X-User-ID", "anonymous")


@router.get("/")
async def list_devices() -> List[Dict[str, Any]]:
    """List all devices with their current status and overrides."""
    # Mock implementation - would query actual device store
    devices = [
        {
            "id": "inv-1",
            "type": "inverter",
            "make": "Generic",
            "model": "SunSpec-103",
            "status": "online",
            "profile": "Generic SunSpec-103 v1.2",
            "overrides_count": 2,
            "last_sample": "2025-09-22T12:00:00Z",
            "latency_ms": 23
        },
        {
            "id": "bms-1", 
            "type": "bms",
            "make": "Generic",
            "model": "MQTT",
            "status": "online",
            "profile": "Generic MQTT BMS v1.0",
            "overrides_count": 0,
            "last_sample": "2025-09-22T12:00:00Z",
            "latency_ms": 18
        }
    ]
    return devices


@router.post("/")
async def create_device(
    device: DeviceCreateRequest,
    request: Request,
    user_id: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create a new device with audit logging."""
    
    # Validate device config
    try:
        config = DeviceConfig(**device.model_dump(exclude={"overrides"}))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid device config: {e}")
    
    # Log the creation
    audit_logger.log_device_create(
        user_id=user_id,
        device_id=device.id,
        device_config=device.model_dump(),
        ip_address=request.client.host if request.client else None
    )
    
    # Mock save - would integrate with actual device store
    return {
        "id": device.id,
        "status": "created",
        "message": f"Device {device.id} created successfully"
    }


@router.put("/{device_id}")
async def update_device(
    device_id: str,
    updates: DeviceUpdateRequest,
    request: Request,
    user_id: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update device configuration with audit trail."""
    
    # Mock old config retrieval
    old_config = {"make": "Generic", "model": "Old-Model"}
    
    # Apply updates
    new_config = old_config.copy()
    for field, value in updates.model_dump(exclude_unset=True).items():
        if value is not None:
            new_config[field] = value
    
    # Log the update
    audit_logger.log(
        user_id=user_id,
        action="device_update",
        resource_type="device", 
        resource_id=device_id,
        old_value=old_config,
        new_value=new_config,
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "id": device_id,
        "status": "updated",
        "changes": len([k for k, v in updates.model_dump(exclude_unset=True).items() if v is not None])
    }


@router.delete("/{device_id}")
async def delete_device(
    device_id: str,
    request: Request,
    user_id: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete device with audit logging."""
    
    # Log the deletion
    audit_logger.log(
        user_id=user_id,
        action="device_delete",
        resource_type="device",
        resource_id=device_id,
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "id": device_id,
        "status": "deleted"
    }


__all__ = ["router", "DeviceCreateRequest", "DeviceUpdateRequest"]
