#!/usr/bin/env bash
set -euo pipefail

CONFIG_PATH=${1:-/etc/ems/config.yaml}

if [[ $EUID -eq 0 ]]; then
  echo "This script must run as the non-root ems user" >&2
  exit 1
fi

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Config file not found: $CONFIG_PATH" >&2
  exit 1
fi

sudo install -d -o ems -g ems /var/log/ems
sudo install -d -o ems -g ems /etc/ems
sudo install -m 640 -o ems -g ems "$CONFIG_PATH" /etc/ems/config.yaml
sudo install -m 644 systemd/ems.service /etc/systemd/system/ems.service
sudo systemctl daemon-reload
sudo systemctl enable --now ems.service
