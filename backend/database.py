from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Index
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
    
    # Primary key components
    session_id = Column(String(255), primary_key=True)
    timestamp = Column(Integer, primary_key=True)  # Unix timestamp
    eye_side = Column(String(10), primary_key=True)  # 'left' or 'right'
    
    # Recording metadata
    recording_number = Column(Integer, nullable=True)
    
    # Iris center coordinates
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