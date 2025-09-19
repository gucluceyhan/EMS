# Operations Manual

## Raspberry Pi Preparation
1. Install Raspberry Pi OS Lite 64-bit and update the firmware.
2. Create a non-root user `ems` with sudo-less service ownership.
3. Enable SSH key authentication and disable password login.
4. Install dependencies: `sudo apt install python3.11 python3.11-venv chrony ufw`.
5. Configure `chrony` for reliable UTC time and verify hardware RTC if present.
6. Set up `ufw` to only allow SSH and the LAN API/UI port.
7. Add the `ems` user to `dialout`, `i2c`, and `gpio` groups for serial/DIO access.

## Deployment Steps
```bash
sudo -u ems git clone https://git.example.com/ems-edge.git /opt/ems-edge
cd /opt/ems-edge
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp config.yaml /etc/ems/config.yaml  # edit for the site before enabling
scripts/install_systemd.sh /etc/ems/config.yaml
sudo systemctl daemon-reload
sudo systemctl enable --now ems.service
```

## Configuration Management
- Keep sensitive tokens in `/etc/ems/.env` with `chmod 600` and owned by `ems`.
- Use environment variables to override YAML values (e.g., `EMS_GLOBAL__UPLINK__API_KEY`).
- Maintain version-controlled point-map files under `/etc/ems/pointmaps` and update the
  register map exporter target after any change.

## Monitoring & Logs
- Structured logs appear at `/var/log/ems/ems.jsonl`. Use `jq` for filtering.
- Prometheus metrics are available at `http://<host>:8080/metrics`.
- `GET /health` returns overall status; integrate with external monitoring.
- `emsctl tail` streams logs, `emsctl metrics` fetches key counters.

## Backup & Retention
- The SQLite database runs in WAL mode at `data/ems.sqlite`. Schedule daily rsync backups.
- Hourly Parquet exports are stored under `data/exports` and can be shipped off-device.
- Retention cleanup runs nightly removing records older than `retention_days`.

## Upgrades & Rollback
1. Stop the service: `sudo systemctl stop ems.service`.
2. Pull the new tag and review release notes.
3. Run database migrations if provided.
4. Start the service and monitor `/health` and logs.
5. If issues arise, revert to the previous git tag, reinstall dependencies, and restart.

## Incident Response
- Controls remain disabled by default; confirm both switches before enabling.
- For runaway devices, disable the poller via config and redeploy.
- Export a live snapshot using `emsctl export snapshot --window 120` for root cause analysis.
- Escalate to engineering with logs, snapshot JSON, and register map payload.

## OTA Strategy
- The repository supports OTA by pulling signed release bundles and verifying checksums.
- Ensure `systemd` `WatchdogSec` is configured (see service file) for automatic recovery.
