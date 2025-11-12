from copy import deepcopy
from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)

# Preserve original activities state so tests don't leak changes
_original = deepcopy(activities)


def reset_state():
    for name, data in _original.items():
        activities[name]["participants"] = list(data["participants"])  # copy list


def test_get_activities_returns_all():
    reset_state()
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Ensure a known activity is present
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_success():
    reset_state()
    email = "newstudent@mergington.edu"
    resp = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp.status_code == 200
    # Verify participant added
    data = client.get("/activities").json()
    assert email in data["Chess Club"]["participants"]


def test_signup_duplicate():
    reset_state()
    existing_email = _original["Chess Club"]["participants"][0]
    resp = client.post(f"/activities/Chess%20Club/signup?email={existing_email}")
    assert resp.status_code == 400
    body = resp.json()
    assert body["detail"] == "Student is already signed up for this activity"


def test_signup_activity_not_found():
    reset_state()
    resp = client.post("/activities/Unknown Activity/signup?email=test@x.com")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Activity not found"


def test_delete_participant_success():
    reset_state()
    # Ensure a removable participant is present
    participant = _original["Chess Club"]["participants"][0]
    resp = client.delete(f"/activities/Chess%20Club/participants?email={participant}")
    assert resp.status_code == 200
    # Confirm removal
    data = client.get("/activities").json()
    assert participant not in data["Chess Club"]["participants"]


def test_delete_participant_not_registered():
    reset_state()
    resp = client.delete("/activities/Chess%20Club/participants?email=not_in_list@x.com")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Student not registered for this activity"


def test_delete_activity_not_found():
    reset_state()
    resp = client.delete("/activities/Nope/participants?email=a@b.com")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Activity not found"
