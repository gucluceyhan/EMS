from __future__ import annotations

import logging
import os
from logging import Logger
from typing import Any

import json
import structlog

DEFAULT_LOG_LEVEL = "INFO"
LOG_PATH = os.environ.get("EMS_LOG_PATH", "/var/log/ems/ems.jsonl")


def setup_logging(level: str = DEFAULT_LOG_LEVEL, json_output: bool = True) -> Logger:
    log_level = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(level=log_level)
    processors: list[structlog.types.Processor] = [
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", key="ts"),
    ]
    if json_output:
        processors.append(_json_renderer)
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
    return structlog.get_logger()


def _json_renderer(logger: Any, name: str, event_dict: dict[str, Any]) -> str:
    return json.dumps(event_dict, default=str)


__all__ = ["setup_logging"]
