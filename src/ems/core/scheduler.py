from __future__ import annotations

import asyncio
import random
from collections.abc import Awaitable, Callable
from typing import Any, List

from .health import HealthRegistry


class Scheduler:
    def __init__(self, health: HealthRegistry, jitter_seconds: int = 5) -> None:
        self._tasks: List[asyncio.Task[Any]] = []
        self._health = health
        self._jitter = jitter_seconds
        self._closing = asyncio.Event()

    async def shutdown(self) -> None:
        self._closing.set()
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)

    def schedule_periodic(
        self,
        name: str,
        interval: float,
        coro_factory: Callable[[], Awaitable[Any]],
        backoff_factor: float = 2.0,
        max_backoff: float = 300.0,
    ) -> None:
        async def runner() -> None:
            backoff = interval
            while not self._closing.is_set():
                delay = interval + random.uniform(0, self._jitter)
                await asyncio.sleep(delay)
                try:
                    await coro_factory()
                except asyncio.CancelledError:
                    raise
                except Exception as exc:  # noqa: BLE001
                    self._health.update(name, healthy=False, message=str(exc))
                    backoff = min(backoff * backoff_factor, max_backoff)
                    await asyncio.sleep(backoff)
                else:
                    backoff = interval
                    self._health.update(name, healthy=True, message="ok")

        self._tasks.append(asyncio.create_task(runner(), name=name))

    def schedule_background(self, name: str, coro: Awaitable[Any]) -> None:
        async def wrapper() -> None:
            try:
                await coro
                self._health.update(name, healthy=True, message="completed")
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                self._health.update(name, healthy=False, message=str(exc))

        self._tasks.append(asyncio.create_task(wrapper(), name=name))


__all__ = ["Scheduler"]
