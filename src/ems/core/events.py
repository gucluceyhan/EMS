from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any, AsyncIterator, DefaultDict


class EventBus:
    """Simple async publish/subscribe event bus."""

    def __init__(self) -> None:
        self._queues: DefaultDict[str, list[asyncio.Queue[Any]]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def subscribe(self, topic: str) -> AsyncIterator[Any]:
        queue: asyncio.Queue[Any] = asyncio.Queue()
        async with self._lock:
            self._queues[topic].append(queue)
        try:
            while True:
                item = await queue.get()
                yield item
        finally:
            async with self._lock:
                self._queues[topic].remove(queue)

    async def publish(self, topic: str, message: Any) -> None:
        async with self._lock:
            queues = list(self._queues.get(topic, []))
        for queue in queues:
            await queue.put(message)


__all__ = ["EventBus"]
