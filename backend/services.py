from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import EyeTrackingData, CalibrationData
from typing import List, Optional
from datetime import datetime
from utils import get_euclidean_distance, calculate_normalized_position, apply_noise_reduction_to_normalized_data

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
        Store calibration data in the dedicated calibration table
        """
        stored_count = 0
        
        for i, point in enumerate(calibration_points):
            timestamp = point.get('timestamp')
            confidence = point.get('confidence')
            gaze_direction = point.get('gaze_direction', 'center')  # Default to center if not specified
            
            # Process left eye data
            if point.get('leftEye'):
                left_eye = point['leftEye']
                left_center = left_eye.get('center', {})
                left_corners = left_eye.get('corners', [])
                
                # Create left eye calibration record
                left_record = CalibrationData(
                    session_id=session_id,
                    timestamp=timestamp,
                    eye_side='left',
                    gaze_direction=gaze_direction,
                    iris_x=left_center.get('x'),
                    iris_y=left_center.get('y'),
                    iris_z=left_center.get('z'),
                    corner_left_x=left_corners[0].get('x') if len(left_corners) > 0 else None,
                    corner_left_y=left_corners[0].get('y') if len(left_corners) > 0 else None,
                    corner_left_z=left_corners[0].get('z') if len(left_corners) > 0 else None,
                    corner_right_x=left_corners[1].get('x') if len(left_corners) > 1 else None,
                    corner_right_y=left_corners[1].get('y') if len(left_corners) > 1 else None,
                    corner_right_z=left_corners[1].get('z') if len(left_corners) > 1 else None,
                    confidence=confidence,
                    calibration_point_index=i
                )
                self.db.add(left_record)
                stored_count += 1
            
            # Process right eye data
            if point.get('rightEye'):
                right_eye = point['rightEye']
                right_center = right_eye.get('center', {})
                right_corners = right_eye.get('corners', [])
                
                # Create right eye calibration record
                right_record = CalibrationData(
                    session_id=session_id,
                    timestamp=timestamp,
                    eye_side='right',
                    gaze_direction=gaze_direction,
                    iris_x=right_center.get('x'),
                    iris_y=right_center.get('y'),
                    iris_z=right_center.get('z'),
                    corner_left_x=right_corners[0].get('x') if len(right_corners) > 0 else None,
                    corner_left_y=right_corners[0].get('y') if len(right_corners) > 0 else None,
                    corner_left_z=right_corners[0].get('z') if len(right_corners) > 0 else None,
                    corner_right_x=right_corners[1].get('x') if len(right_corners) > 1 else None,
                    corner_right_y=right_corners[1].get('y') if len(right_corners) > 1 else None,
                    corner_right_z=right_corners[1].get('z') if len(right_corners) > 1 else None,
                    confidence=confidence,
                    calibration_point_index=i
                )
                self.db.add(right_record)
                stored_count += 1
        
        await self.db.commit()
        return stored_count
    
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
    
    async def get_recording_data(self, session_id: str, recording_number: int, eye: str = "both", noise_reduction: bool = False) -> List[dict]:
        """
        Get normalized X positions for a specific recording with optional filtering and noise reduction
        """
        # Get calibration data for normalization
        calibration_data = await self.get_calibration_data(session_id)
        
        # Build query based on eye filter
        if eye == "left":
            query = select(EyeTrackingData).where(
                EyeTrackingData.session_id == session_id,
                EyeTrackingData.recording_number == recording_number,
                EyeTrackingData.eye_side == 'left'
            )
        elif eye == "right":
            query = select(EyeTrackingData).where(
                EyeTrackingData.session_id == session_id,
                EyeTrackingData.recording_number == recording_number,
                EyeTrackingData.eye_side == 'right'
            )
        else:  # "both"
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
        
        
        data = list(data_by_timestamp.values())
        
        # Convert to normalized X positions
        normalized_data = []
        for point in data:
            normalized_position = calculate_normalized_position(point, calibration_data)
            if normalized_position is not None:
                normalized_data.append({
                    'timestamp': point['timestamp'],
                    'x': normalized_position
                })
        
        # Apply noise reduction if requested
        if noise_reduction:
            normalized_data = apply_noise_reduction_to_normalized_data(normalized_data)
        
        return normalized_data
    
    async def get_calibration_data(self, session_id: str) -> List[dict]:
        """
        Get calibration data for a session from the dedicated calibration table
        """
        query = select(CalibrationData).where(CalibrationData.session_id == session_id)
        result = await self.db.execute(query)
        records = result.scalars().all()
        
        # Group by timestamp and gaze direction, then reconstruct the original format
        data_by_timestamp_gaze = {}
        for record in records:
            key = (record.timestamp, record.gaze_direction)
            if key not in data_by_timestamp_gaze:
                data_by_timestamp_gaze[key] = {
                    'timestamp': record.timestamp,
                    'confidence': record.confidence,
                    'gaze_direction': record.gaze_direction,
                    'calibration_point_index': record.calibration_point_index,
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
                data_by_timestamp_gaze[key]['leftEye'] = eye_data
            else:
                data_by_timestamp_gaze[key]['rightEye'] = eye_data
        
        return list(data_by_timestamp_gaze.values())
    
    async def get_calibration_data_by_direction(self, session_id: str, gaze_direction: str) -> List[dict]:
        """
        Get calibration data for a specific gaze direction (left, center, right)
        """
        query = select(CalibrationData).where(
            CalibrationData.session_id == session_id,
            CalibrationData.gaze_direction == gaze_direction
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
                    'gaze_direction': record.gaze_direction,
                    'calibration_point_index': record.calibration_point_index,
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
            'total_recordings': len(recording_numbers),
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
    
    async def get_all_sessions(self) -> List[dict]:
        """
        Get all sessions with their recordings and summary information
        """
        # Get all unique session IDs
        query = select(EyeTrackingData.session_id).distinct()
        result = await self.db.execute(query)
        session_ids = [row[0] for row in result.fetchall()]
        
        sessions = []
        for session_id in session_ids:
            # Get summary for this session
            summary = await self.get_session_summary(session_id)
            
            # Get recordings for this session
            recordings = []
            for recording_number in summary['recording_numbers']:
                # Get data count for this recording
                query = select(EyeTrackingData).where(
                    EyeTrackingData.session_id == session_id,
                    EyeTrackingData.recording_number == recording_number
                )
                result = await self.db.execute(query)
                data_count = len(result.scalars().all())
                
                # Get the first timestamp for this recording to calculate duration
                query = select(EyeTrackingData.timestamp).where(
                    EyeTrackingData.session_id == session_id,
                    EyeTrackingData.recording_number == recording_number
                ).order_by(EyeTrackingData.timestamp.asc()).limit(1)
                result = await self.db.execute(query)
                first_timestamp = result.scalar()
                
                # Get the last timestamp for this recording
                query = select(EyeTrackingData.timestamp).where(
                    EyeTrackingData.session_id == session_id,
                    EyeTrackingData.recording_number == recording_number
                ).order_by(EyeTrackingData.timestamp.desc()).limit(1)
                result = await self.db.execute(query)
                last_timestamp = result.scalar()
                
                # Calculate duration in seconds
                duration = 0
                if first_timestamp and last_timestamp:
                    duration = (last_timestamp - first_timestamp) // 1000  # Convert to seconds
                
                recordings.append({
                    'recording_number': recording_number,
                    'data_points': data_count,
                    'duration': duration,
                    'timestamp': first_timestamp,
                    'session_id': session_id
                })
            
            sessions.append({
                'session_id': session_id,
                'summary': summary,
                'recordings': recordings
            })
        
        return sessions 