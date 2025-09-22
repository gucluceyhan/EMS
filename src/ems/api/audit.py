"""Audit logging for EMS actions."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from pydantic import BaseModel


class AuditEntry(BaseModel):
    timestamp: datetime
    user_id: str
    action: str
    resource_type: str
    resource_id: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None


class AuditLogger:
    def __init__(self, log_path: str = "data/audit.jsonl"):
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def log(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> None:
        entry = AuditEntry(
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message,
        )
        
        with self.log_path.open("a", encoding="utf-8") as f:
            f.write(entry.model_dump_json() + "\n")

    def log_device_control(
        self,
        user_id: str,
        device_id: str,
        command: str,
        value: Any = None,
        success: bool = True,
        error: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        self.log(
            user_id=user_id,
            action="device_control",
            resource_type="device",
            resource_id=device_id,
            new_value={"command": command, "value": value},
            success=success,
            error_message=error,
            ip_address=ip_address,
        )

    def log_device_create(
        self,
        user_id: str,
        device_id: str,
        device_config: Dict[str, Any],
        ip_address: Optional[str] = None,
    ) -> None:
        self.log(
            user_id=user_id,
            action="device_create",
            resource_type="device",
            resource_id=device_id,
            new_value=device_config,
            ip_address=ip_address,
        )

    def log_profile_update(
        self,
        user_id: str,
        profile_id: str,
        old_config: Dict[str, Any],
        new_config: Dict[str, Any],
        ip_address: Optional[str] = None,
    ) -> None:
        self.log(
            user_id=user_id,
            action="profile_update",
            resource_type="profile",
            resource_id=profile_id,
            old_value=old_config,
            new_value=new_config,
            ip_address=ip_address,
        )


__all__ = ["AuditLogger", "AuditEntry"]
