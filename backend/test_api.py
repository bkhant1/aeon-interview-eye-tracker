import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_eye_tracking():
    """Test the eye tracking endpoint"""
    # Sample eye tracking data
    data = {
        "session_id": "test-session-123",
        "positions": [
            {
                "x": 200.5,
                "y": 150.2,
                "timestamp": int(time.time() * 1000),
                "confidence": 0.85
            },
            {
                "x": 205.1,
                "y": 148.9,
                "timestamp": int(time.time() * 1000),
                "confidence": 0.87
            },
            {
                "x": 198.3,
                "y": 152.7,
                "timestamp": int(time.time() * 1000),
                "confidence": 0.82
            }
        ],
        "timestamp": int(time.time() * 1000)
    }
    
    response = requests.post(f"{BASE_URL}/api/eye-tracking", json=data)
    print(f"Eye tracking POST: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    return data["session_id"]

def test_get_session(session_id):
    """Test getting session data"""
    response = requests.get(f"{BASE_URL}/api/eye-tracking/{session_id}")
    print(f"Get session {session_id}: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_list_sessions():
    """Test listing all sessions"""
    response = requests.get(f"{BASE_URL}/api/eye-tracking")
    print(f"List sessions: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_delete_session(session_id):
    """Test deleting a session"""
    response = requests.delete(f"{BASE_URL}/api/eye-tracking/{session_id}")
    print(f"Delete session {session_id}: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

if __name__ == "__main__":
    print("Testing Eye Tracking API")
    print("=" * 50)
    
    # Test health endpoint
    test_health()
    
    # Test eye tracking endpoint
    session_id = test_eye_tracking()
    
    # Test getting session data
    test_get_session(session_id)
    
    # Test listing sessions
    test_list_sessions()
    
    # Test deleting session
    test_delete_session(session_id)
    
    print("All tests completed!") 