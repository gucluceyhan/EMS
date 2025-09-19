#!/usr/bin/env python3
"""Convert YAML point maps to JSON representation."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import yaml


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert YAML point map to JSON")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    data: Any = yaml.safe_load(args.input.read_text(encoding="utf-8"))
    payload = json.dumps(data, indent=2)
    if args.output:
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload)


if __name__ == "__main__":
    main()
