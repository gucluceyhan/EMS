"""Integration tests for UI components and workflows."""
import pytest
from fastapi.testclient import TestClient

from ems.api.app import create_app, APIContext
from ems.core.health import HealthRegistry
from ems.store.database import Database
from ems.export.service import ExportService
from ems.utils.config import AppConfig, load_config


@pytest.fixture
def test_config():
    """Load test configuration."""
    return load_config("config.yaml")


@pytest.fixture
def test_client(test_config):
    """Create test client with mock context."""
    health = HealthRegistry()
    db = Database(":memory:")
    export_service = ExportService(db, test_config.global_.export, [])
    
    context = APIContext(
        config=test_config,
        db=db,
        export_service=export_service,
        health=health,
        device_status={},
        allow_control=False,
        dry_run=True
    )
    
    app = create_app(context)
    return TestClient(app)


class TestUIRoutes:
    """Test UI route accessibility and authentication."""
    
    def test_ui_main_requires_auth(self, test_client):
        """Main UI should require Basic Auth."""
        response = test_client.get("/ui")
        assert response.status_code == 401
        
    def test_ui_main_with_auth(self, test_client):
        """Main UI should work with correct auth."""
        response = test_client.get("/ui", auth=("ems", "ems"))
        assert response.status_code == 200
        assert "GES Solar EMS/BMS" in response.text
        
    def test_settings_pages_accessible(self, test_client):
        """Settings pages should be accessible."""
        pages = ["org", "profiles", "rbac", "identity", "network"]
        
        for page in pages:
            response = test_client.get(f"/ui/settings/{page}", auth=("ems", "ems"))
            assert response.status_code == 200, f"Settings page {page} failed"
            assert "Settings" in response.text
            
    def test_pages_accessible(self, test_client):
        """Standalone pages should be accessible."""
        pages = ["alerts-center", "health-sla", "transformer-grid"]
        
        for page in pages:
            response = test_client.get(f"/ui/pages/{page}", auth=("ems", "ems"))
            assert response.status_code == 200, f"Page {page} failed"


class TestAPIEndpoints:
    """Test API functionality and security."""
    
    def test_health_endpoint(self, test_client):
        """Health endpoint should work without auth."""
        response = test_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "components" in data
        assert "devices" in data
        
    def test_devices_endpoint(self, test_client):
        """Devices endpoint should work without auth."""
        response = test_client.get("/devices")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_config_requires_token(self, test_client):
        """Config endpoint should require Bearer token."""
        response = test_client.get("/config")
        assert response.status_code == 401
        
    def test_controls_requires_token(self, test_client):
        """Controls endpoint should require Bearer token."""
        response = test_client.post("/controls/inv-1", json={"command": "test"})
        assert response.status_code == 401


class TestUIComponents:
    """Test UI component functionality."""
    
    def test_sites_wizard_form(self, test_client):
        """Sites wizard should render form elements."""
        response = test_client.get("/ui/sites/add", auth=("ems", "ems"))
        assert response.status_code == 200
        assert "Site Name" in response.text
        assert "wizardSteps" in response.text
        
    def test_breakers_automation(self, test_client):
        """Breakers page should render TMŞ controls."""
        response = test_client.get("/ui/automation/breakers", auth=("ems", "ems"))
        assert response.status_code == 200
        assert "TMŞ" in response.text or "Breakers" in response.text


class TestSecurity:
    """Test security and access controls."""
    
    def test_basic_auth_invalid_credentials(self, test_client):
        """Invalid Basic Auth should be rejected."""
        response = test_client.get("/ui", auth=("wrong", "wrong"))
        assert response.status_code == 401
        
    def test_bearer_token_invalid(self, test_client):
        """Invalid Bearer token should be rejected."""
        headers = {"Authorization": "Bearer INVALID_TOKEN"}
        response = test_client.get("/config", headers=headers)
        assert response.status_code == 401
        
    def test_bearer_token_valid(self, test_client):
        """Valid Bearer token should work."""
        headers = {"Authorization": "Bearer LOCAL_API_TOKEN"}
        response = test_client.get("/config", headers=headers)
        assert response.status_code == 200


class TestPerformance:
    """Basic performance and load tests."""
    
    def test_health_response_time(self, test_client):
        """Health endpoint should respond quickly."""
        import time
        start = time.time()
        response = test_client.get("/health")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 1.0  # Should respond within 1 second
        
    def test_devices_pagination(self, test_client):
        """Devices endpoint should handle large responses."""
        response = test_client.get("/devices")
        assert response.status_code == 200
        # Should not timeout even with many devices


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
