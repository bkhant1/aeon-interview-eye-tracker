from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, String, BigInteger, Float, DateTime, Text, Index
from datetime import datetime
import os

# Database URL - can be overridden by environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost/eye_tracking")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

class EyeTrackingData(Base):
    __tablename__ = "eye_tracking_data"
    
    session_id = Column(String(255), primary_key=True)
    timestamp = Column(BigInteger, primary_key=True)
    eye_side = Column(String(10), primary_key=True)
    
    recording_number = Column(BigInteger, nullable=True)
    
    iris_x = Column(Float, nullable=True)
    iris_y = Column(Float, nullable=True)
    iris_z = Column(Float, nullable=True)
    
    # Eye corner coordinates (left corner)
    corner_left_x = Column(Float, nullable=True)
    corner_left_y = Column(Float, nullable=True)
    corner_left_z = Column(Float, nullable=True)
    
    # Eye corner coordinates (right corner)
    corner_right_x = Column(Float, nullable=True)
    corner_right_y = Column(Float, nullable=True)
    corner_right_z = Column(Float, nullable=True)
    
    # Additional metadata
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes for better query performance
    __table_args__ = (
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
        Index('idx_recording', 'session_id', 'recording_number'),
    )

class CalibrationData(Base):
    __tablename__ = "calibration_data"
    
    session_id = Column(String(255), primary_key=True)
    timestamp = Column(BigInteger, primary_key=True)
    eye_side = Column(String(10), primary_key=True)
    gaze_direction = Column(String(10), primary_key=True)  # 'left', 'center', 'right'
    
    # Actual eye position
    iris_x = Column(Float, nullable=True)
    iris_y = Column(Float, nullable=True)
    iris_z = Column(Float, nullable=True)
    
    # Eye corner coordinates (left corner)
    corner_left_x = Column(Float, nullable=True)
    corner_left_y = Column(Float, nullable=True)
    corner_left_z = Column(Float, nullable=True)
    
    # Eye corner coordinates (right corner)
    corner_right_x = Column(Float, nullable=True)
    corner_right_y = Column(Float, nullable=True)
    corner_right_z = Column(Float, nullable=True)
    
    # Additional metadata
    confidence = Column(Float, nullable=True)
    calibration_point_index = Column(BigInteger, nullable=True)  # Which calibration point this was
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes for better query performance
    __table_args__ = (
        Index('idx_calibration_session_timestamp', 'session_id', 'timestamp'),
        Index('idx_calibration_point_index', 'session_id', 'calibration_point_index'),
        Index('idx_calibration_gaze_direction', 'session_id', 'gaze_direction'),
    )

# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Initialize database
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 