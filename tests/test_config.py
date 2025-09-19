from ems.utils.config import load_config


def test_env_override(tmp_path, monkeypatch):
    config_text = """
version: 1
plant:
  id: test
  name: Test Plant
  timezone: UTC
global:
  enable_control: false
  dry_run: true
  storage:
    sqlite_path: "test.sqlite"
    retention_days: 30
    export_parquet_dir: "exports"
    export_interval_s: 3600
  uplink:
    url: "https://example.com"
    api_key: "abc"
    batch_period_s: 300
    max_batch_kb: 256
    tls_verify: true
  export:
    enable: true
    snapshot_url: "https://example.com/snapshot"
    registermap_url: "https://example.com/maps"
    auth_token: "token"
    include_raw_registers: false
  api:
    bind_host: "0.0.0.0"
    port: 8080
    auth_token: "local"
  ui:
    enabled: true
    bind_host: "0.0.0.0"
    port: 8080
    basic_auth_user: "user"
    basic_auth_password: "pass"
  logging:
    level: "INFO"
    json: true
  security:
    auth_token: "local"
  scheduler:
    jitter_seconds: 5
    watchdog_interval_s: 30
mqtt:
  host: localhost
can:
  interface: can0
devices: []
"""
    path = tmp_path / "config.yaml"
    path.write_text(config_text)
    monkeypatch.setenv("EMS_GLOBAL__ENABLE_CONTROL", "true")
    config = load_config(path)
    assert config.global_.enable_control is True
