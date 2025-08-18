# Eye Tracking Backend API

A FastAPI backend for receiving and storing eye tracking data with PostgreSQL database.

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

The API will be available at `http://localhost:8001`
