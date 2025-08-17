from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import EyeTrackingData
from typing import List, Optional
from datetime import datetime

class EyeTrackingService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def store_recording_data(self, session_id: str, recording_number: int, positions: List[dict]) -> int:
        """
        Store recording data in flattened format
        """
        stored_count = 0
        
        for position in positions:
            timestamp = position.get('timestamp')
            confidence = position.get('confidence')
            
            # Process left eye data
            if position.get('leftEye'):
                left_eye = position['leftEye']
                left_center = left_eye.get('center', {})
                left_corners = left_eye.get('corners', [])
                
                # Create left eye record
                left_record = EyeTrackingData(
                    session_id=session_id,
                    timestamp=timestamp,
                    eye_side='left',
                    recording_number=recording_number,
                    iris_x=left_center.get('x'),
                    iris_y=left_center.get('y'),
                    iris_z=left_center.get('z'),
                    corner_left_x=left_corners[0].get('x') if len(left_corners) > 0 else None,
                    corner_left_y=left_corners[0].get('y') if len(left_corners) > 0 else None,
                    corner_left_z=left_corners[0].get('z') if len(left_corners) > 0 else None,
                    corner_right_x=left_corners[1].get('x') if len(left_corners) > 1 else None,
                    corner_right_y=left_corners[1].get('y') if len(left_corners) > 1 else None,
                    corner_right_z=left_corners[1].get('z') if len(left_corners) > 1 else None,
                    confidence=confidence
                )
                self.db.add(left_record)
                stored_count += 1
            
            # Process right eye data
            if position.get('rightEye'):
                right_eye = position['rightEye']
                right_center = right_eye.get('center', {})
                right_corners = right_eye.get('corners', [])
                
                # Create right eye record
                right_record = EyeTrackingData(
                    session_id=session_id,
                    timestamp=timestamp,
                    eye_side='right',
                    recording_number=recording_number,
                    iris_x=right_center.get('x'),
                    iris_y=right_center.get('y'),
                    iris_z=right_center.get('z'),
                    corner_left_x=right_corners[0].get('x') if len(right_corners) > 0 else None,
                    corner_left_y=right_corners[0].get('y') if len(right_corners) > 0 else None,
                    corner_left_z=right_corners[0].get('z') if len(right_corners) > 0 else None,
                    corner_right_x=right_corners[1].get('x') if len(right_corners) > 1 else None,
                    corner_right_y=right_corners[1].get('y') if len(right_corners) > 1 else None,
                    corner_right_z=right_corners[1].get('z') if len(right_corners) > 1 else None,
                    confidence=confidence
                )
                self.db.add(right_record)
                stored_count += 1
        
        await self.db.commit()
        return stored_count
    
    async def store_calibration_data(self, session_id: str, calibration_points: List[dict]) -> int:
        """
        Store calibration data in flattened format (recording_number = 0 for calibration)
        """
        return await self.store_recording_data(session_id, 0, calibration_points)
    
    async def get_session_data(self, session_id: str) -> List[dict]:
        """
        Get all data for a session
        """
        query = select(EyeTrackingData).where(EyeTrackingData.session_id == session_id)
        result = await self.db.execute(query)
        records = result.scalars().all()
        
        # Group by timestamp and reconstruct the original format
        data_by_timestamp = {}
        for record in records:
            if record.timestamp not in data_by_timestamp:
                data_by_timestamp[record.timestamp] = {
                    'timestamp': record.timestamp,
                    'confidence': record.confidence,
                    'leftEye': None,
                    'rightEye': None
                }
            
            eye_data = {
                'center': {
                    'x': record.iris_x,
                    'y': record.iris_y,
                    'z': record.iris_z
                },
                'corners': [
                    {
                        'x': record.corner_left_x,
                        'y': record.corner_left_y,
                        'z': record.corner_left_z
                    },
                    {
                        'x': record.corner_right_x,
                        'y': record.corner_right_y,
                        'z': record.corner_right_z
                    }
                ]
            }
            
            if record.eye_side == 'left':
                data_by_timestamp[record.timestamp]['leftEye'] = eye_data
            else:
                data_by_timestamp[record.timestamp]['rightEye'] = eye_data
        
        return list(data_by_timestamp.values())
    
    async def get_recording_data(self, session_id: str, recording_number: int) -> List[dict]:
        """
        Get data for a specific recording
        """
        query = select(EyeTrackingData).where(
            EyeTrackingData.session_id == session_id,
            EyeTrackingData.recording_number == recording_number
        )
        result = await self.db.execute(query)
        records = result.scalars().all()
        
        # Group by timestamp and reconstruct the original format
        data_by_timestamp = {}
        for record in records:
            if record.timestamp not in data_by_timestamp:
                data_by_timestamp[record.timestamp] = {
                    'timestamp': record.timestamp,
                    'confidence': record.confidence,
                    'leftEye': None,
                    'rightEye': None
                }
            
            eye_data = {
                'center': {
                    'x': record.iris_x,
                    'y': record.iris_y,
                    'z': record.iris_z
                },
                'corners': [
                    {
                        'x': record.corner_left_x,
                        'y': record.corner_left_y,
                        'z': record.corner_left_z
                    },
                    {
                        'x': record.corner_right_x,
                        'y': record.corner_right_y,
                        'z': record.corner_right_z
                    }
                ]
            }
            
            if record.eye_side == 'left':
                data_by_timestamp[record.timestamp]['leftEye'] = eye_data
            else:
                data_by_timestamp[record.timestamp]['rightEye'] = eye_data
        
        return list(data_by_timestamp.values())
    
    async def get_calibration_data(self, session_id: str) -> List[dict]:
        """
        Get calibration data for a session (recording_number = 0)
        """
        return await self.get_recording_data(session_id, 0)
    
    async def get_session_summary(self, session_id: str) -> dict:
        """
        Get summary statistics for a session
        """
        # Get all recordings for the session
        query = select(EyeTrackingData.recording_number).where(
            EyeTrackingData.session_id == session_id
        ).distinct()
        result = await self.db.execute(query)
        recording_numbers = [row[0] for row in result.fetchall()]
        
        # Get total data points
        query = select(EyeTrackingData).where(EyeTrackingData.session_id == session_id)
        result = await self.db.execute(query)
        total_records = len(result.scalars().all())
        
        return {
            'session_id': session_id,
            'total_recordings': len([r for r in recording_numbers if r > 0]),
            'has_calibration': 0 in recording_numbers,
            'total_data_points': total_records,
            'recording_numbers': sorted(recording_numbers)
        }
    
    async def delete_session_data(self, session_id: str) -> int:
        """
        Delete all data for a session
        """
        query = delete(EyeTrackingData).where(EyeTrackingData.session_id == session_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount 