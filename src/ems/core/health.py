from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict


@dataclass
class ComponentHealth:
    name: str
    healthy: bool = True
    message: str | None = None
    last_heartbeat: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    extra: Dict[str, Any] = field(default_factory=dict)

    def heartbeat(self, healthy: bool, message: str | None = None, **extra: Any) -> None:
        self.healthy = healthy
        self.message = message
        self.last_heartbeat = datetime.now(timezone.utc)
        if extra:
            self.extra.update(extra)


class HealthRegistry:
    def __init__(self) -> None:
        self._components: Dict[str, ComponentHealth] = {}

    def update(self, name: str, healthy: bool, message: str | None = None, **extra: Any) -> None:
        comp = self._components.get(name)
        if comp is None:
            comp = ComponentHealth(name=name)
            self._components[name] = comp
        comp.heartbeat(healthy=healthy, message=message, **extra)

    def as_dict(self) -> Dict[str, Any]:
        return {
            name: {
                "healthy": comp.healthy,
                "message": comp.message,
                "last_heartbeat": comp.last_heartbeat.isoformat(),
                "extra": comp.extra,
            }
            for name, comp in self._components.items()
        }


__all__ = ["HealthRegistry", "ComponentHealth"]
