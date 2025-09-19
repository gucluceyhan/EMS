from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict

import yaml


class PointMap:
    def __init__(self, path: Path, payload: Dict[str, Any]) -> None:
        self.path = path
        self.payload = payload
        self.metadata = payload.get("metadata", {})
        self.points = payload.get("points", [])
        raw = json.dumps(payload, sort_keys=True).encode()
        self.hash = hashlib.sha256(raw).hexdigest()


_pointmap_cache: dict[Path, PointMap] = {}


def load_point_map(path: str | Path) -> PointMap:
    p = Path(path)
    if p in _pointmap_cache:
        return _pointmap_cache[p]
    payload = yaml.safe_load(p.read_text(encoding="utf-8"))
    point_map = PointMap(p, payload)
    _pointmap_cache[p] = point_map
    return point_map


__all__ = ["PointMap", "load_point_map"]
