# Eye Tracking Backend API

A FastAPI backend for receiving and storing eye tracking data with PostgreSQL database.

## Features

- Receive eye tracking data with session management
- Store positions with timestamps in PostgreSQL
- Session-based data organization
- RESTful API endpoints
- CORS enabled for frontend integration
- Flattened database schema for efficient querying

## Database Schema

The eye tracking data is stored in a flattened PostgreSQL table structure:

### `eye_tracking_data` Table

**Primary Key:** `(session_id, timestamp, eye_side)`

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | VARCHAR(255) | Session identifier |
| `timestamp` | INTEGER | Unix timestamp |
| `eye_side` | VARCHAR(10) | 'left' or 'right' |
| `recording_number` | INTEGER | Recording session number (0 = calibration) |
| `iris_x`, `iris_y`, `iris_z` | FLOAT | Iris center coordinates |
| `corner_left_x`, `corner_left_y`, `corner_left_z` | FLOAT | Left eye corner coordinates |
| `corner_right_x`, `corner_right_y`, `corner_right_z` | FLOAT | Right eye corner coordinates |
| `confidence` | FLOAT | Detection confidence |
| `created_at` | TIMESTAMP | Record creation time |

## Setup

### 1. Install Dependencies

```bash
uv sync
```

### 2. Start PostgreSQL Database

Using Docker Compose (recommended):
```bash
docker-compose up -d postgres
```

Or manually install PostgreSQL and create a database named `eye_tracking`.

### 3. Configure Database Connection

The default connection string is:
```
postgresql+asyncpg://postgres:password@localhost/eye_tracking
```

You can override it with the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgresql+asyncpg://user:password@host/database"
```

### 4. Run the Server

```bash
uv run python main.py
```

Or using uvicorn directly:
```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

The API will be available at `http://localhost:8001`

## API Endpoints

### POST /api/eye-tracking
Receive eye tracking data for a specific session.

**Request Body:**
```json
{
  "session_id": "session-123",
  "positions": [
    {
      "timestamp": 1703123456789,
      "confidence": 0.85,
      "leftEye": {
        "center": {"x": 100.5, "y": 150.2, "z": 0.0},
        "corners": [
          {"x": 90.0, "y": 140.0, "z": 0.0},
          {"x": 110.0, "y": 160.0, "z": 0.0}
        ]
      },
      "rightEye": {
        "center": {"x": 200.5, "y": 150.2, "z": 0.0},
        "corners": [
          {"x": 190.0, "y": 140.0, "z": 0.0},
          {"x": 210.0, "y": 160.0, "z": 0.0}
        ]
      }
    }
  ],
  "timestamp": 1703123456789
}
```

### POST /api/eye-tracking/{session_id}
Submit recording data with recording number.

### POST /api/calibration
Submit calibration data.

### GET /api/eye-tracking/{session_id}
Get all data for a specific session.

### GET /api/recordings/{session_id}
Get all recordings for a specific session.

### GET /api/calibration/{session_id}
Get calibration data for a specific session.

### DELETE /api/sessions/{session_id}
Delete all data for a specific session.

### GET /health
Health check endpoint.

## Database Management

### Using pgAdmin (Optional)

If you started the pgAdmin service:
1. Open http://localhost:8080
2. Login with admin@example.com / admin
3. Add server: host=postgres, port=5432, database=eye_tracking, username=postgres, password=password

### Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it eye_tracking_db psql -U postgres -d eye_tracking

# View data
SELECT * FROM eye_tracking_data LIMIT 10;

# Get session summary
SELECT session_id, COUNT(*) as data_points, 
       COUNT(DISTINCT recording_number) as recordings
FROM eye_tracking_data 
GROUP BY session_id;
```

## Development

For development with additional dependencies:
```bash
uv sync --dev
```

## Data Flow

1. **Frontend** sends `EyePosition` objects with `leftEye`/`rightEye` data
2. **Backend** flattens the data into individual rows per eye per timestamp
3. **Database** stores the flattened structure for efficient querying
4. **API** reconstructs the original format when retrieving data

## Performance Considerations

- Indexes on `(session_id, timestamp)` and `(session_id, recording_number)`
- Flattened schema allows efficient filtering and aggregation
- Async database operations for better concurrency
- Connection pooling with asyncpg

## Production Considerations

- Use environment variables for database credentials
- Set up proper logging
- Add authentication and authorization
- Consider data retention policies
- Set up database backups
- Use connection pooling in production
- Add rate limiting
- Set up monitoring and alerting 