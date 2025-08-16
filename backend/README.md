# Eye Tracking Backend API

A simple FastAPI backend for receiving and storing eye tracking data.

## Features

- Receive eye tracking data with session management
- Store positions with timestamps
- Session-based data organization
- RESTful API endpoints
- CORS enabled for frontend integration

## Setup

1. Install dependencies using uv:
```bash
uv sync
```

2. Run the server:
```bash
uv run python main.py
```

Or using uvicorn directly:
```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

The API will be available at `http://localhost:8001`

## Development

For development with additional dependencies:
```bash
uv sync --dev
```

## API Endpoints

### POST /api/eye-tracking
Receive eye tracking data for a session.

**Request Body:**
```json
{
  "session_id": "session-123",
  "positions": [
    {
      "x": 200.5,
      "y": 150.2,
      "timestamp": 1703123456789,
      "confidence": 0.85
    }
  ],
  "timestamp": 1703123456789
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully received 1 positions",
  "session_id": "session-123",
  "positions_received": 1,
  "total_positions": 1
}
```

### GET /api/eye-tracking/{session_id}
Get all data for a specific session.

### GET /api/eye-tracking
List all active sessions.

### DELETE /api/eye-tracking/{session_id}
Delete a specific session.

### DELETE /api/eye-tracking
Clear all sessions.

### GET /health
Health check endpoint.

## Data Models

- **EyePosition**: Individual eye position with x, y coordinates, timestamp, and optional confidence
- **EyeTrackingData**: Batch of eye positions with session ID
- **EyeTrackingResponse**: API response with success status and metadata

## Development

The API uses in-memory storage for simplicity. For production, consider:
- Adding a database (PostgreSQL, MongoDB)
- Implementing authentication
- Adding data validation and sanitization
- Setting up proper logging
- Adding rate limiting

## CORS

CORS is enabled for frontend integration with origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative frontend port) 