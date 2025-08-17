from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import json
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, init_db
from services import EyeTrackingService

app = FastAPI(title="Eye Tracking API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models - Updated to match frontend schema
class EyeLandmark(BaseModel):
    x: float
    y: float
    z: float

class EyeData(BaseModel):
    corners: List[EyeLandmark]
    center: EyeLandmark

class EyePosition(BaseModel):
    timestamp: int
    confidence: Optional[float] = None
    leftEye: Optional[EyeData] = None
    rightEye: Optional[EyeData] = None

class EyeTrackingData(BaseModel):
    session_id: str
    positions: List[EyePosition]
    timestamp: int

class RecordingData(BaseModel):
    session_id: str
    recording_number: int
    positions: List[EyePosition]
    timestamp: int

class CalibrationData(BaseModel):
    session_id: str
    calibration_points: List[EyePosition]
    timestamp: int

class EyeTrackingResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    positions_received: int
    total_positions: int

class RecordingResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    recording_number: int
    positions_received: int

class CalibrationResponse(BaseModel):
    success: bool
    message: str
    session_id: str
    calibration_points_received: int

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Eye Tracking API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/eye-tracking", response_model=EyeTrackingResponse)
async def receive_eye_tracking_data(data: EyeTrackingData, db: AsyncSession = Depends(get_db)):
    """
    Receive eye tracking data for a specific session
    """
    try:
        service = EyeTrackingService(db)
        
        # Convert Pydantic models to dict for storage
        positions_dict = [position.dict() for position in data.positions]
        
        # Store the data (recording_number = None for general tracking data)
        stored_count = await service.store_recording_data(data.session_id, None, positions_dict)
        
        # Log the received data
        print(f"Session {data.session_id}: Received {len(data.positions)} positions")
        print(f"Session {data.session_id}: Stored {stored_count} data points")
        
        return EyeTrackingResponse(
            success=True,
            message=f"Successfully received {len(data.positions)} positions",
            session_id=data.session_id,
            positions_received=len(data.positions),
            total_positions=stored_count
        )
        
    except Exception as e:
        print(f"Error processing eye tracking data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/eye-tracking/{session_id}", response_model=RecordingResponse)
async def receive_recording_data(session_id: str, data: RecordingData, db: AsyncSession = Depends(get_db)):
    """
    Receive recording data for a specific session with recording number
    """
    try:
        # Validate session_id matches
        if data.session_id != session_id:
            raise HTTPException(status_code=400, detail="Session ID mismatch")
        
        service = EyeTrackingService(db)
        
        # Convert Pydantic models to dict for storage
        positions_dict = [position.dict() for position in data.positions]
        
        # Store the recording data
        stored_count = await service.store_recording_data(session_id, data.recording_number, positions_dict)
        
        # Log the received data
        print(f"Session {session_id}: Received recording #{data.recording_number} with {len(data.positions)} positions")
        print(f"Session {session_id}: Stored {stored_count} data points")
        
        return RecordingResponse(
            success=True,
            message=f"Successfully received recording #{data.recording_number} with {len(data.positions)} positions",
            session_id=session_id,
            recording_number=data.recording_number,
            positions_received=len(data.positions)
        )
        
    except Exception as e:
        print(f"Error processing recording data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/calibration", response_model=CalibrationResponse)
async def receive_calibration_data(data: CalibrationData, db: AsyncSession = Depends(get_db)):
    """
    Receive calibration data for a specific session
    """
    try:
        service = EyeTrackingService(db)
        
        # Convert Pydantic models to dict for storage
        calibration_dict = [point.dict() for point in data.calibration_points]
        
        # Store calibration data (recording_number = 0 for calibration)
        stored_count = await service.store_calibration_data(data.session_id, calibration_dict)
        
        # Log the received data
        print(f"Session {data.session_id}: Received {len(data.calibration_points)} calibration points")
        print(f"Session {data.session_id}: Stored {stored_count} calibration data points")
        
        return CalibrationResponse(
            success=True,
            message=f"Successfully received {len(data.calibration_points)} calibration points",
            session_id=data.session_id,
            calibration_points_received=len(data.calibration_points)
        )
        
    except Exception as e:
        print(f"Error processing calibration data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/eye-tracking/{session_id}")
async def get_session_data(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get all data for a specific session
    """
    try:
        service = EyeTrackingService(db)
        data = await service.get_session_data(session_id)
        summary = await service.get_session_summary(session_id)
        
        return {
            "session_id": session_id,
            "summary": summary,
            "data": data
        }
    except Exception as e:
        print(f"Error retrieving session data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/recordings/{session_id}")
async def get_session_recordings(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get all recordings for a specific session
    """
    try:
        service = EyeTrackingService(db)
        summary = await service.get_session_summary(session_id)
        
        # Get data for each recording
        recordings = {}
        for recording_number in summary['recording_numbers']:
            if recording_number > 0:  # Skip calibration (recording_number = 0)
                data = await service.get_recording_data(session_id, recording_number)
                recordings[f"recording_{recording_number}"] = {
                    "recording_number": recording_number,
                    "data": data,
                    "data_points": len(data)
                }
        
        return {
            "session_id": session_id,
            "summary": summary,
            "recordings": recordings
        }
    except Exception as e:
        print(f"Error retrieving recordings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/calibration/{session_id}")
async def get_session_calibration(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get calibration data for a specific session
    """
    try:
        service = EyeTrackingService(db)
        data = await service.get_calibration_data(session_id)
        
        return {
            "session_id": session_id,
            "calibration_data": data,
            "data_points": len(data)
        }
    except Exception as e:
        print(f"Error retrieving calibration data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete all data for a specific session
    """
    try:
        service = EyeTrackingService(db)
        deleted_count = await service.delete_session_data(session_id)
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} data points for session {session_id}",
            "session_id": session_id,
            "deleted_count": deleted_count
        }
    except Exception as e:
        print(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 