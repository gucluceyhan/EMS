#!/usr/bin/env python3
"""Convert Modbus scan CSV into a YAML point map template."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any

import yaml


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate YAML point-map from CSV scan")
    parser.add_argument("csv_file", type=Path)
    parser.add_argument("--metadata", help="JSON metadata to include", default="{}")
    parser.add_argument("--output", type=Path, default=Path("pointmap.yaml"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    with args.csv_file.open() as fh:
        reader = csv.DictReader(fh)
        points: list[dict[str, Any]] = []
        for row in reader:
            address = int(row["address"])
            points.append(
                {
                    "name": f"REG_{address}",
                    "fc": 3,
                    "address": address,
                    "type": "uint16",
                    "count": 1,
                }
            )
    data = {
        "metadata": json.loads(args.metadata),
        "points": points,
    }
    with args.output.open("w", encoding="utf-8") as fh:
        yaml.safe_dump(data, fh, sort_keys=False)
    print(f"Saved point-map to {args.output}")


if __name__ == "__main__":
    main()
