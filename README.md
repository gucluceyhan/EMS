# GES Solar EMS Edge Agent

## Overview
The GES Solar Energy Management System (EMS) edge agent runs on Raspberry Pi 4/5 hardware and provides
safe, secure, and vendor-agnostic integration for PV plants. The agent polls inverters, meters, weather
stations, trackers, battery management systems (BMS), and generic Modbus devices while exposing a local
REST API, a read-only web UI, and reliable upstream batch delivery.

The repository ships with:

- Async Python 3.11 runtime built around FastAPI and SQLAlchemy
- Pluggable drivers for SunSpec inverters, IEC meters, MQTT BMS, trackers, weather sensors, and generic
  Modbus devices via YAML point maps
- Local time-series storage (SQLite WAL) with hourly Parquet export
- JSON logging, Prometheus metrics, and rich health reporting
- Configurable safety controls that are **disabled by default** unless `enable_control=true` and `dry_run=false`
- Tools for register map management and safe Modbus scanning
- Systemd unit, CLI utility, and comprehensive documentation

## Quickstart

```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv libpq-dev
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m ems --config config.yaml
```

The first launch initializes the SQLite database at `data/ems.sqlite`, starts simulated pollers for the
sample devices, and serves the local API/UI at `http://127.0.0.1:8080`.

### REST API Highlights
- `GET /health` – consolidated component status and watchdog telemetry
- `GET /metrics` – Prometheus exposition format metrics
- `GET /devices` – registered devices and health signals
- `GET /measurements` – minute-level time-series filtering by device/metric
- `GET /export/snapshot` – JSON snapshot view of the latest readings
- `GET /export/registermaps` – active point map catalog used by the agent
- `POST /controls/*` – guarded control endpoints (disabled until explicitly enabled)

### Local Web UI
Navigate to `/ui` for a minimal single-page dashboard containing:
- Plant overview card with key KPIs
- Device grid with last poll timestamps and health
- Live measurement table with search/filter and auto-refresh
- Lightweight sparklines for active power, irradiation, and SOC (last 60 minutes)

Authentication uses HTTP basic credentials defined under `config.global.ui`.

### Safety & Controls
Controls are guarded by:
1. Global switches (`enable_control` and `dry_run`) – both must be toggled to allow real control
2. Bearer token authentication (shared with API/Exporter security token)
3. Per-command allowlist implemented in driver classes
4. Audit logging of every attempt (successful or not)

### Uplink
Every five minutes the uplink service aggregates the most recent minute-resolution samples and posts a
JSON batch to the configured endpoint with retry/backoff and disk buffering. When offline, batches are
retained in the SQLite queue and retried periodically.

### Directory Layout
```
src/ems/           # Core EMS application package
pointmaps/         # YAML register maps for SunSpec, meters, trackers, generic Modbus, and BMS
scripts/           # CLI tools, installers, and Modbus utilities
systemd/           # Systemd unit files and tmpfiles helpers
tests/             # Pytest suite with fixtures and simulator coverage
config.yaml        # Sample configuration
```

### Next Steps
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for component-level design
- Follow [OPERATIONS.md](OPERATIONS.md) for deployment and maintenance guidance
- Use `scripts/install_systemd.sh` to install the service on a Raspberry Pi
- Run `scripts/emsctl` for day-two operations (health checks, exports, diagnostics)

## License
Proprietary – all rights reserved by GES Energy Systems.
