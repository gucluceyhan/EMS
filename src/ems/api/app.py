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

    # === PROFILES API ENDPOINTS ===
    @app.get("/api/profiles")
    async def get_profiles(token: None = Depends(require_token)) -> dict[str, Any]:
        """Get all device profiles"""
        profiles = context.config.profiles if hasattr(context.config, 'profiles') else []
        return {"profiles": [p.model_dump() for p in profiles]}

    @app.get("/api/profiles/{profile_id}")
    async def get_profile(profile_id: str, token: None = Depends(require_token)) -> dict[str, Any]:
        """Get specific device profile"""
        profiles = context.config.profiles if hasattr(context.config, 'profiles') else []
        profile = next((p for p in profiles if p.id == profile_id), None)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile.model_dump()

    @app.post("/api/profiles")
    async def create_profile(
        profile_data: dict[str, Any], token: None = Depends(require_token)
    ) -> dict[str, Any]:
        """Create new device profile"""
        # TODO: Implement profile creation logic
        return {"message": "Profile created", "id": profile_data.get("id")}

    @app.put("/api/profiles/{profile_id}")
    async def update_profile(
        profile_id: str, profile_data: dict[str, Any], token: None = Depends(require_token)
    ) -> dict[str, Any]:
        """Update existing device profile"""
        # TODO: Implement profile update logic
        return {"message": "Profile updated", "id": profile_id}

    @app.delete("/api/profiles/{profile_id}")
    async def delete_profile(profile_id: str, token: None = Depends(require_token)) -> dict[str, Any]:
        """Delete device profile"""
        # TODO: Implement profile deletion logic
        return {"message": "Profile deleted", "id": profile_id}

    @app.get("/api/device-types")
    async def get_device_types(token: None = Depends(require_token)) -> dict[str, Any]:
        """Get all supported device types"""
        from ..utils.config import DeviceType
        device_types = []
        for device_type in DeviceType:
            device_types.append({
                "value": device_type.value,
                "label": DeviceType.get_display_name(device_type.value),
                "icon": DeviceType.get_icon(device_type.value)
            })
        return {"device_types": device_types}

    @app.get("/api/protocols")
    async def get_protocols(token: None = Depends(require_token)) -> dict[str, Any]:
        """Get all supported protocols"""
        from ..utils.config import ProtocolType
        protocols = []
        for protocol in ProtocolType:
            protocols.append({
                "value": protocol.value,
                "label": protocol.value.replace("_", " ").title()
            })
        return {"protocols": protocols}

    @app.get("/api/pointmaps")
    async def get_pointmaps(token: None = Depends(require_token)) -> dict[str, Any]:
        """Get all available point map files"""
        from pathlib import Path
        pointmaps_dir = Path("pointmaps")
        pointmaps = []
        
        if pointmaps_dir.exists():
            for file in pointmaps_dir.glob("*.yaml"):
                pointmaps.append({
                    "path": str(file),
                    "name": file.stem,
                    "filename": file.name
                })
        
        return {"pointmaps": pointmaps}

    @app.get("/api/pointmaps/{pointmap_name}")
    async def get_pointmap_content(
        pointmap_name: str, token: None = Depends(require_token)
    ) -> dict[str, Any]:
        """Get point map file content"""
        from pathlib import Path
        import yaml
        
        pointmap_path = Path("pointmaps") / f"{pointmap_name}.yaml"
        if not pointmap_path.exists():
            raise HTTPException(status_code=404, detail="Point map not found")
        
        try:
            with open(pointmap_path, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
            return {"content": content, "path": str(pointmap_path)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading point map: {str(e)}")

    @app.post("/api/pointmaps")
    async def create_pointmap(
        pointmap_data: dict[str, Any], token: None = Depends(require_token)
    ) -> dict[str, Any]:
        """Create new point map file"""
        from pathlib import Path
        import yaml
        
        name = pointmap_data.get("name")
        content = pointmap_data.get("content")
        
        if not name or not content:
            raise HTTPException(status_code=400, detail="Name and content are required")
        
        pointmap_path = Path("pointmaps") / f"{name}.yaml"
        pointmap_path.parent.mkdir(exist_ok=True)
        
        try:
            with open(pointmap_path, 'w', encoding='utf-8') as f:
                yaml.safe_dump(content, f, default_flow_style=False, sort_keys=False)
            return {"message": "Point map created", "path": str(pointmap_path)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating point map: {str(e)}")

    @app.get("/api/protocol-defaults")
    async def get_protocol_defaults(token: None = Depends(require_token)) -> dict[str, Any]:
        """Get default protocol configurations"""
        defaults = context.config.global_.protocol_defaults if hasattr(context.config.global_, 'protocol_defaults') else {}
        return {"protocol_defaults": defaults.model_dump() if hasattr(defaults, 'model_dump') else {}}

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

        @app.get("/ui/sites", response_class=HTMLResponse)
        async def ui_sites(request: Request, _: None = Depends(require_basic)) -> HTMLResponse:
            return render_template("sites/index.html", request)

        @app.get("/ui/sites/add", response_class=HTMLResponse)
        async def ui_sites_add(request: Request, _: None = Depends(require_basic)) -> HTMLResponse:
            return render_template("sites-add.html", request)

        @app.get("/ui/sites/{site_id}", response_class=HTMLResponse)
        async def ui_sites_detail(
            site_id: str, request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            # Convert site_id to display name for template
            site_name = site_id.replace('-', ' ').replace('ges', 'GES').title()
            return templates.TemplateResponse(
                "sites/detail.html",
                {
                    "request": request,
                    "plant": context.config.plant.model_dump(),
                    "site_id": site_id,
                    "site_name": site_name,
                },
            )

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

        @app.get("/ui/control/{page}", response_class=HTMLResponse)
        async def ui_control_dynamic(
            page: str, request: Request, _: None = Depends(require_basic)
        ) -> HTMLResponse:
            name = f"control/{page}.html"
            if not (templates_dir / name).exists():
                raise HTTPException(status_code=404, detail="Not Found")
            return render_template(name, request)

    return app


__all__ = ["create_app", "APIContext"]
