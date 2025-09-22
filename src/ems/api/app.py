from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse
from fastapi.security import (
    HTTPBasic,
    HTTPBasicCredentials,
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, Counter, generate_latest

from ..core.health import HealthRegistry
from ..store.database import Database
from ..utils.config import AppConfig
from ..utils.models import ControlResult
from ..export.service import ExportService


@dataclass
class APIContext:
    config: AppConfig
    db: Database
    export_service: ExportService
    health: HealthRegistry
    device_status: Dict[str, Dict[str, Any]]
    allow_control: bool
    dry_run: bool


security_scheme = HTTPBearer(auto_error=False)
basic_auth = HTTPBasic()
registry = CollectorRegistry()
requests_counter = Counter("ems_api_requests_total", "API Requests", registry=registry)


def create_app(context: APIContext) -> FastAPI:
    app = FastAPI(title="GES Solar EMS", version="0.1.0")
    static_dir = Path(__file__).resolve().parent.parent / "ui" / "static"
    templates_dir = Path(__file__).resolve().parent.parent / "ui" / "templates"
    ui_config = context.config.global_.ui
    ui_enabled = ui_config.enabled

    def require_token(
        credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    ) -> None:
        expected = context.config.global_.api.auth_token
        if (
            not credentials
            or credentials.scheme.lower() != "bearer"
            or credentials.credentials != expected
        ):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    def require_basic(credentials: HTTPBasicCredentials = Depends(basic_auth)) -> None:
        if (
            credentials.username != ui_config.basic_auth_user
            or credentials.password != ui_config.basic_auth_password
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

    @app.middleware("http")
    async def count_requests(request: Request, call_next):  # type: ignore[no-untyped-def]
        requests_counter.inc()
        return await call_next(request)

    @app.get("/health")
    async def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "components": context.health.as_dict(),
            "devices": context.device_status,
        }

    @app.get("/metrics")
    async def metrics() -> Response:
        data = generate_latest(registry)
        return Response(content=data, media_type=CONTENT_TYPE_LATEST)

    @app.get("/devices")
    async def devices() -> list[dict[str, Any]]:
        return list(context.device_status.values())

    @app.get("/measurements")
    async def measurements(
        device_id: str, metric: Optional[str] = None, since: Optional[str] = None
    ) -> list[dict[str, Any]]:
        since_dt = datetime.fromisoformat(since) if since else None
        records = await context.db.measurements_for_device(
            device_id=device_id, metric=metric, since=since_dt
        )
        return [
            {
                "timestamp_utc": rec.timestamp_utc.isoformat(),
                "device_id": rec.device_id,
                "metric": rec.metric,
                "value": rec.value,
                "unit": rec.unit,
                "quality": rec.quality,
            }
            for rec in records
        ]

    @app.get("/config")
    async def get_config(token: None = Depends(require_token)) -> dict[str, Any]:
        data = context.config.model_dump(mode="json", by_alias=True)
        data["global"]["api"]["auth_token"] = "***"
        data["global"]["export"]["auth_token"] = "***"
        data["global"]["uplink"]["api_key"] = "***"
        return data

    @app.get("/export/snapshot")
    async def export_snapshot(
        window_s: int = 60, token: None = Depends(require_token)
    ) -> dict[str, Any]:
        return await context.export_service.snapshot(window_s)

    @app.get("/export/registermaps")
    async def export_registermaps(token: None = Depends(require_token)) -> dict[str, Any]:
        return await context.export_service.register_maps()

    @app.post("/controls/{device_id}")
    async def controls(
        device_id: str, payload: Dict[str, Any], token: None = Depends(require_token)
    ) -> ControlResult:
        if not context.allow_control or context.dry_run:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Controls disabled")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Control path not yet implemented"
        )

    if ui_enabled:
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
        templates = Jinja2Templates(directory=str(templates_dir))

        def render_template(name: str, request: Request) -> HTMLResponse:
            return templates.TemplateResponse(
                name,
                {
                    "request": request,
                    "plant": context.config.plant.model_dump(),
                },
            )

        @app.get("/ui/api/devices")
        async def ui_devices(_: None = Depends(require_basic)) -> list[dict[str, Any]]:
            return list(context.device_status.values())

        @app.get("/ui", response_class=HTMLResponse)
        async def ui(request: Request, _: None = Depends(require_basic)) -> HTMLResponse:
            return render_template("index.html", request)

        @app.get("/ui/sites/add", response_class=HTMLResponse)
        async def ui_sites_add(request: Request, _: None = Depends(require_basic)) -> HTMLResponse:
            return render_template("sites-add.html", request)

        @app.get("/ui/automation/breakers", response_class=HTMLResponse)
        async def ui_automation_breakers(
            request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            return render_template("automation-breakers.html", request)

        # Settings routes (additive)
        @app.get("/ui/settings/org", response_class=HTMLResponse)
        async def ui_settings_org(
            request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            return render_template("settings/org.html", request)

        @app.get("/ui/settings/profiles", response_class=HTMLResponse)
        async def ui_settings_profiles(
            request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            return render_template("settings/profiles.html", request)

        @app.get("/ui/settings/health", response_class=HTMLResponse)
        async def ui_settings_health(
            request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            return render_template("settings/health.html", request)

        # Generic settings/pages catch-all (non-destructive, template must exist)
        @app.get("/ui/settings/{page}", response_class=HTMLResponse)
        async def ui_settings_dynamic(
            page: str, request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            name = f"settings/{page}.html"
            if not (templates_dir / name).exists():
                raise HTTPException(status_code=404, detail="Not Found")
            return render_template(name, request)

        @app.get("/ui/pages/{page}", response_class=HTMLResponse)
        async def ui_pages_dynamic(
            page: str, request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            name = f"pages/{page}.html"
            if not (templates_dir / name).exists():
                raise HTTPException(status_code=404, detail="Not Found")
            return render_template(name, request)

    return app


__all__ = ["create_app", "APIContext"]
