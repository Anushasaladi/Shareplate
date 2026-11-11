from tests.conftest import login_headers, register


def test_register_and_login(client):
    res = register(client, "A@Example.com", "Donor")
    assert res.status_code == 201
    assert res.json()["email"] == "a@example.com"
    assert "password" not in res.json() and "password_hash" not in res.json()
    headers = login_headers(client, "a@example.com")
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200 and me.json()["role"] == "Donor"


def test_duplicate_email_rejected(client):
    assert register(client, "dup@example.com", "Donor").status_code == 201
    assert register(client, "dup@example.com", "Recipient").status_code == 409


def test_weak_password_and_bad_role_rejected(client):
    base = {"full_name": "Zed Zed", "email": "z@example.com", "phone": "9876543210", "role": "Donor"}
    assert client.post("/api/auth/register", json={**base, "password": "short1"}).status_code == 422
    assert client.post("/api/auth/register", json={**base, "password": "onlyletters"}).status_code == 422
    assert client.post("/api/auth/register", json={**base, "password": "Passw0rdX", "role": "Admin"}).status_code == 422


def test_login_wrong_password(client):
    register(client, "b@example.com", "Donor")
    res = client.post("/api/auth/login", json={"email": "b@example.com", "password": "WrongPass1"})
    assert res.status_code == 401


def test_protected_routes_need_token(client):
    assert client.get("/api/foods").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


def test_cannot_change_role_via_profile(client, users):
    res = client.put("/api/users/me", json={"role": "Donor"}, headers=users["r1"])
    assert res.status_code == 422
    res = client.put("/api/users/me", json={"full_name": "Rita R", "address": "New addr"}, headers=users["r1"])
    assert res.status_code == 200 and res.json()["full_name"] == "Rita R"
