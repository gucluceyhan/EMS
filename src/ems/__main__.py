from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from .app import run_app
from .utils.config import load_config


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="GES Solar EMS edge agent")
    parser.add_argument("--config", default="config.yaml", help="Path to config YAML")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = load_config(Path(args.config))
    asyncio.run(run_app(config))


if __name__ == "__main__":
    main()
