from datetime import datetime, timedelta, timezone

from tests.conftest import food_payload


def create_food(client, headers, **kw):
    res = client.post("/api/foods", json=food_payload(**kw), headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def test_role_enforcement(client, users):
    assert client.post("/api/foods", json=food_payload(), headers=users["r1"]).status_code == 403
    food = create_food(client, users["donor"])
    body = {"food_id": food["food_id"], "requested_quantity": 1}
    assert client.post("/api/requests", json=body, headers=users["donor"]).status_code == 403


def test_invalid_food_rejected(client, users):
    assert client.post("/api/foods", json=food_payload(quantity=0), headers=users["donor"]).status_code == 422
    past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    assert client.post("/api/foods", json=food_payload(available_until=past), headers=users["donor"]).status_code == 422
    assert client.post("/api/foods", json=food_payload(category="Rocks"), headers=users["donor"]).status_code == 422


def test_browse_search_and_filter(client, users):
    create_food(client, users["donor"], food_name="Chapati", category="Bakery")
    create_food(client, users["donor"], food_name="Apples", category="Fruits & Vegetables")
    all_items = client.get("/api/foods", headers=users["r1"]).json()
    assert len(all_items) == 2
    assert len(client.get("/api/foods?q=apple", headers=users["r1"]).json()) == 1
    assert len(client.get("/api/foods?category=Bakery", headers=users["r1"]).json()) == 1
    assert len(client.get("/api/foods?location=market", headers=users["r1"]).json()) == 2


def test_full_donation_flow(client, users):
    food = create_food(client, users["donor"], quantity=10)
    fid = food["food_id"]

    # over-request is rejected (409)
    res = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 11}, headers=users["r1"])
    assert res.status_code == 409

    res = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 4}, headers=users["r1"])
    assert res.status_code == 201 and res.json()["request_status"] == "Pending"
    rid = res.json()["request_id"]

    # duplicate pending request blocked
    assert client.post("/api/requests", json={"food_id": fid, "requested_quantity": 1}, headers=users["r1"]).status_code == 409

    incoming = client.get("/api/requests/incoming", headers=users["donor"]).json()
    assert len(incoming) == 1 and incoming[0]["recipient_name"] == "Rita Recipient"

    # another donor cannot approve it
    assert client.patch(f"/api/requests/{rid}/approve", headers=users["other_donor"]).status_code == 403
    # recipient cannot approve it
    assert client.patch(f"/api/requests/{rid}/approve", headers=users["r1"]).status_code == 403

    res = client.patch(f"/api/requests/{rid}/approve", headers=users["donor"])
    assert res.status_code == 200 and res.json()["request_status"] == "Approved"
    listing = client.get(f"/api/foods/{fid}", headers=users["r1"]).json()
    assert listing["remaining_quantity"] == 6 and listing["listing_status"] == "Partially Reserved"

    # recipient sees donor contact after approval
    mine = client.get("/api/requests/my-requests", headers=users["r1"]).json()
    assert mine[0]["donor_phone"] == "9876543210"

    # a second recipient takes the rest -> fully reserved, then listing disappears from browse
    r2 = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 6}, headers=users["r2"]).json()
    assert client.patch(f"/api/requests/{r2['request_id']}/approve", headers=users["donor"]).status_code == 200
    assert client.get(f"/api/foods/{fid}", headers=users["r1"]).json()["listing_status"] == "Fully Reserved"
    assert client.get("/api/foods", headers=users["r1"]).json() == []

    # completion
    assert client.patch(f"/api/requests/{rid}/complete", headers=users["donor"]).json()["request_status"] == "Completed"
    assert client.get(f"/api/foods/{fid}", headers=users["r1"]).json()["listing_status"] == "Fully Reserved"
    client.patch(f"/api/requests/{r2['request_id']}/complete", headers=users["donor"])
    assert client.get(f"/api/foods/{fid}", headers=users["r1"]).json()["listing_status"] == "Completed"

    history = client.get("/api/history/donations", headers=users["donor"]).json()
    assert len(history) == 2
    assert len(client.get("/api/history/requests", headers=users["r1"]).json()) == 1

    stats = client.get("/api/dashboard/donor", headers=users["donor"]).json()
    assert stats["completed_donations"] == 2 and stats["total_listings"] == 1


def test_cannot_approve_more_than_remaining(client, users):
    food = create_food(client, users["donor"], quantity=5)
    fid = food["food_id"]
    a = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 4}, headers=users["r1"]).json()
    b = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 3}, headers=users["r2"]).json()
    assert client.patch(f"/api/requests/{a['request_id']}/approve", headers=users["donor"]).status_code == 200
    assert client.patch(f"/api/requests/{b['request_id']}/approve", headers=users["donor"]).status_code == 409


def test_reject_and_cancel(client, users):
    fid = create_food(client, users["donor"])["food_id"]
    a = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 2}, headers=users["r1"]).json()
    b = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 2}, headers=users["r2"]).json()
    res = client.patch(f"/api/requests/{a['request_id']}/reject", headers=users["donor"])
    assert res.json()["request_status"] == "Rejected"
    # another recipient cannot cancel someone else's request
    assert client.patch(f"/api/requests/{b['request_id']}/cancel", headers=users["r1"]).status_code == 403
    res = client.patch(f"/api/requests/{b['request_id']}/cancel", headers=users["r2"])
    assert res.json()["request_status"] == "Cancelled"
    # only approved requests can be completed
    assert client.patch(f"/api/requests/{a['request_id']}/complete", headers=users["donor"]).status_code == 409


def test_listing_ownership_and_soft_delete(client, users):
    fid = create_food(client, users["donor"])["food_id"]
    assert client.put(f"/api/foods/{fid}", json={"food_name": "Hacked"}, headers=users["other_donor"]).status_code == 403
    assert client.delete(f"/api/foods/{fid}", headers=users["other_donor"]).status_code == 403
    res = client.put(f"/api/foods/{fid}", json={"quantity": 20}, headers=users["donor"])
    assert res.status_code == 200 and res.json()["remaining_quantity"] == 20

    req = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 2}, headers=users["r1"]).json()
    assert client.delete(f"/api/foods/{fid}", headers=users["donor"]).status_code == 200
    assert client.get("/api/foods", headers=users["r1"]).json() == []
    # pending request was rejected, record preserved
    mine = client.get("/api/requests/my-requests", headers=users["r1"]).json()
    assert mine[0]["request_id"] == req["request_id"] and mine[0]["request_status"] == "Rejected"
    # new requests on cancelled listing are refused
    assert client.post("/api/requests", json={"food_id": fid, "requested_quantity": 1}, headers=users["r2"]).status_code == 409


def test_request_privacy(client, users):
    fid = create_food(client, users["donor"])["food_id"]
    rid = client.post("/api/requests", json={"food_id": fid, "requested_quantity": 2}, headers=users["r1"]).json()["request_id"]
    assert client.get(f"/api/requests/{rid}", headers=users["r2"]).status_code == 403
    assert client.get(f"/api/requests/{rid}", headers=users["other_donor"]).status_code == 403
    assert client.get(f"/api/requests/{rid}", headers=users["r1"]).status_code == 200
    assert client.get(f"/api/requests/{rid}", headers=users["donor"]).status_code == 200
    # pending: recipient does not see donor contact
    assert client.get(f"/api/requests/{rid}", headers=users["r1"]).json()["donor_phone"] is None
