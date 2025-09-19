# Architecture Guide

## High-Level Components

```text
+-------------------------+         +-----------------------+
|  Device Pollers         |         |  MQTT / CAN Listeners |
| (Inverters, Meters, etc)|         |  (BMS integration)    |
+------------+------------+         +-----------+-----------+
             |                                  |
             v                                  v
        +----+----------------------------------+----+
        |              Core Scheduler & Event Bus     |
        +----+------------------+----------------+----+
             |                  |                |
             v                  v                v
   +---------+-----+   +--------+------+  +------+----------+
   | Storage Layer |   | REST API & UI |  | Uplink Publisher|
   | (SQLite+TS)   |   | (FastAPI)     |  | (5-min batches) |
   +-------+-------+   +--------+------+  +------+----------+
           |                     |                |
           v                     v                v
   +-------+-------+     +-------+------+   +------+--------+
   | Exporters     |     | CLI & Scripts |   | Watchdog     |
   +---------------+     +--------------+   +---------------+
```

## Core Modules

- **ems.core.scheduler** – orchestrates async pollers with jitter, retry/backoff, and circuit
  breaker semantics. Implements watchdog heartbeats and graceful shutdown.
- **ems.core.events** – lightweight publish/subscribe bus used by drivers, storage, and uplink.
- **ems.core.health** – aggregates component health, last-seen timestamps, and error streaks.
- **ems.drivers** – adapter implementations for SunSpec inverters, IEC meters, Modbus devices,
  MQTT BMS, CAN BMS stubs, trackers, and weather sensors. Drivers share a `BaseDriver` contract
  with async lifecycle hooks.
- **ems.io** – protocol clients (Modbus TCP/RTU, MQTT, CAN, HTTP) with pluggable backends. The
  default configuration uses simulators to keep the sample deployment hardware-free.
- **ems.store** – asynchronous SQLAlchemy data access layer with minute-resolution measurement
  persistence, retention, and Parquet exports. Uplink batches reuse the same dataset.
- **ems.api** – FastAPI application exposing health/metrics/devices/measurements/export/control
  endpoints and embedding the in-house web UI.
- **ems.ui** – Static assets and templates powering the `/ui` dashboard. Fetches data through
  REST endpoints to avoid duplication.
- **ems.uplink** – Aggregates 60-second samples into 5-minute windows, handles disk buffering,
  and manages upstream delivery with HTTP retries and TLS verification.
- **ems.export** – JSON exporters for live snapshots and register map catalogs. Listens for
  point-map file changes and pushes updates upstream when available.
- **ems.utils** – shared helpers for configuration, logging, validation, and typed models.

## Data Flow
1. Pollers fetch data from field devices using driver-specific logic.
2. Measurements are normalized into the canonical schema and published on the event bus.
3. Storage subscribers persist the data, update caches for the UI/API, and trigger Parquet exports.
4. The uplink task aggregates the stored data and sends JSON batches to the cloud endpoint.
5. Exporters produce live snapshots/register map catalogs for local clients and remote services.
6. The FastAPI application exposes data and serves the minimal UI over authenticated routes.

## Safety Considerations
- Controls require dual opt-in (config + runtime flags) and token-based authentication.
- Circuit breaker logic prevents runaway retries against failing devices.
- Database writes are batched to reduce SD-card wear; WAL mode is always enabled.
- TLS verification and token-based auth secure uplink/export communications.

## Extensibility
- Drivers are plug-and-play: new device types only need to implement the `BaseDriver` interface
  and provide associated point-map files.
- Event bus decouples producers/consumers, easing integration of analytics or alerting.
- Config loader merges YAML + environment overrides allowing safe multi-site deployments.
- CLI and scripts enable offline tooling for commissioning and troubleshooting.
