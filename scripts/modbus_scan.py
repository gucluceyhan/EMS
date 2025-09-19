#!/usr/bin/env python3
"""Conservative Modbus scanner for commissioning."""
from __future__ import annotations

import argparse
import csv
import random
import time
from typing import Iterable

from pymodbus.client import AsyncModbusTcpClient

SAFE_DELAY = 0.2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Safe Modbus register scanner")
    parser.add_argument("host", help="Modbus TCP host")
    parser.add_argument("--port", type=int, default=502, help="Modbus port")
    parser.add_argument("--unit", type=int, default=1, help="Unit ID")
    parser.add_argument("--start", type=int, default=0, help="Starting register")
    parser.add_argument("--end", type=int, default=100, help="End register")
    parser.add_argument("--fc", choices=[3, 4], type=int, default=3, help="Function code")
    parser.add_argument("--count", type=int, default=1, help="Registers per request")
    parser.add_argument("--delay", type=float, default=SAFE_DELAY, help="Delay between requests (s)")
    parser.add_argument("--output", default="scan.csv", help="CSV output path")
    return parser.parse_args()


def chunked(iterable: Iterable[int], size: int) -> Iterable[list[int]]:
    chunk: list[int] = []
    for item in iterable:
        chunk.append(item)
        if len(chunk) == size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


async def main() -> None:
    args = parse_args()
    client = AsyncModbusTcpClient(args.host, port=args.port)
    await client.connect()
    results: list[dict[str, int | float]] = []
    try:
        for group in chunked(range(args.start, args.end + 1), args.count):
            address = group[0]
            resp = await client.read_holding_registers(address=address, count=len(group), unit=args.unit)
            if resp.isError():
                value = None
            else:
                value = list(resp.registers)
            results.append({"address": address, "value": value})
            time.sleep(args.delay + random.uniform(0, 0.1))
    finally:
        await client.close()
    with open(args.output, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["address", "value"])
        writer.writeheader()
        for row in results:
            writer.writerow(row)
    print(f"Scan complete -> {args.output}")


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
