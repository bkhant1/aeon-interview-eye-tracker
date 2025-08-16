from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import json

app = FastAPI(title="Eye Tracking API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class EyePosition(BaseModel):
    x: float
    y: float
    timestamp: int
    confidence: Optional[float] = None

class EyeTrackingData(BaseModel):
    session_id: str
    positions: List[EyePosition]
    timestamp: int

class CalibrationPoint(BaseModel):
    x: float
    y: float

class CalibrationData(BaseModel):
    session_id: str
    calibration_points: List[CalibrationPoint]
    timestamp: int

class EyeTrackingResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    positions_received: int
    total_positions: int

class CalibrationResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    calibration_points_received: int

# In-memory storage (replace with database in production)
eye_tracking_sessions = {}
calibration_sessions = {}

@app.get("/")
async def root():
    return {"message": "Eye Tracking API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/eye-tracking", response_model=EyeTrackingResponse)
async def receive_eye_tracking_data(data: EyeTrackingData):
    """
    Receive eye tracking data for a specific session
    """
    try:
        session_id = data.session_id
        
        # Initialize session if it doesn't exist
        if session_id not in eye_tracking_sessions:
            eye_tracking_sessions[session_id] = {
                "created_at": datetime.now().isoformat(),
                "positions": [],
                "total_positions": 0
            }
        
        # Add new positions to the session
        session = eye_tracking_sessions[session_id]
        session["positions"].extend(data.positions)
        session["total_positions"] += len(data.positions)
        session["last_updated"] = datetime.now().isoformat()
        
        # Log the received data
        print(f"Session {session_id}: Received {len(data.positions)} positions")
        print(f"Session {session_id}: Total positions: {session['total_positions']}")
        
        return EyeTrackingResponse(
            success=True,
            message=f"Successfully received {len(data.positions)} positions",
            session_id=session_id,
            positions_received=len(data.positions),
            total_positions=session["total_positions"]
        )
        
    except Exception as e:
        print(f"Error processing eye tracking data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/calibration", response_model=CalibrationResponse)
async def receive_calibration_data(data: CalibrationData):
    """
    Receive calibration data for a specific session
    """
    try:
        session_id = data.session_id
        
        # Store calibration data
        calibration_sessions[session_id] = {
            "created_at": datetime.now().isoformat(),
            "calibration_points": data.calibration_points,
            "timestamp": data.timestamp
        }
        
        # Log the received data
        print(f"Session {session_id}: Received {len(data.calibration_points)} calibration points")
        print(f"Session {session_id}: Calibration points: {data.calibration_points}")
        
        return CalibrationResponse(
            success=True,
            message=f"Successfully received {len(data.calibration_points)} calibration points",
            session_id=session_id,
            calibration_points_received=len(data.calibration_points)
        )
        
    except Exception as e:
        print(f"Error processing calibration data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/eye-tracking/{session_id}")
async def get_session_data(session_id: str):
    """
    Get all data for a specific session
    """
    if session_id not in eye_tracking_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = eye_tracking_sessions[session_id]
    return {
        "session_id": session_id,
        "created_at": session["created_at"],
        "last_updated": session.get("last_updated"),
        "total_positions": session["total_positions"],
        "positions": session["positions"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 