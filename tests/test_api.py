import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db, Base
from app.core.config import settings

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

@pytest.fixture
def auth_headers():
    # Register/Login to get token
    username = "testuser"
    password = "testpassword"
    client.post(
        "/auth/register",
        json={
            "username": username,
            "email": "test@example.com",
            "password": password,
            "full_name": "Test User"
        }
    )
    response = client.post(
        "/auth/login",
        data={"username": username, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Rent & Lease Automation System API"}

def test_create_tenant(auth_headers):
    response = client.post(
        "/tenants/",
        json={
            "full_name": "John Doe",
            "phone": "123456789",
            "email": "john@example.com",
            "notes": "Some notes"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "John Doe"
    assert "id" in data

def test_create_unit(auth_headers):
    response = client.post(
        "/units/",
        json={
            "name": "Unit 101",
            "address": "123 Main St",
            "unit_code": "U101",
            "type": "apartment"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["unit_code"] == "U101"

def test_create_lease(auth_headers):
    # First create tenant and unit
    tenant = client.post("/tenants/", json={"full_name": "T1", "phone": "1", "email": "t1@ex.com"}, headers=auth_headers).json()
    unit = client.post("/units/", json={"name": "U1", "address": "A1", "unit_code": "U1"}, headers=auth_headers).json()
    
    response = client.post(
        "/leases/",
        json={
            "tenant_id": tenant["id"],
            "unit_id": unit["id"],
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "rent_amount": 1000.0,
            "payment_frequency_months": 1
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert len(data["payment_schedules"]) == 12
