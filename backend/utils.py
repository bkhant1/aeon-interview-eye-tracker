import math
from typing import List, Optional, Dict

def get_euclidean_distance(point1: dict, point2: dict) -> float:
    """Calculate Euclidean distance between two 3D points"""
    dx = point1['x'] - point2['x']
    dy = point1['y'] - point2['y']
    dz = point1['z'] - point2['z']
    return math.sqrt(dx * dx + dy * dy + dz * dz)

def calculate_normalized_position(eye_position: dict, calibration_points: List[dict]) -> Optional[float]:
    """Calculate normalized X position using calibration data"""
    if not eye_position.get('leftEye') or not calibration_points:
        return None
    
    left_eye = eye_position['leftEye']
    leftmost_calibration = calibration_points[0]
    
    if not leftmost_calibration.get('leftEye'):
        return None
    
    # Calculate distances from calibration
    left_corner_min_distance = get_euclidean_distance(
        leftmost_calibration['leftEye']['center'], 
        leftmost_calibration['leftEye']['corners'][0]
    )
    right_corner_max_distance = get_euclidean_distance(
        leftmost_calibration['leftEye']['center'], 
        leftmost_calibration['leftEye']['corners'][1]
    )
    
    # Calculate range and center
    range_distance = right_corner_max_distance - left_corner_min_distance
    if range_distance == 0:
        return None
    
    # Calculate current position
    current_left_corner_distance = get_euclidean_distance(
        left_eye['center'], 
        left_eye['corners'][0]
    )
    
    # Normalize position
    relative_position = 2*((current_left_corner_distance - left_corner_min_distance) / range_distance - 0.5)
    
    return relative_position

def apply_noise_reduction_to_normalized_data(data: List[Dict[str, float]], window_size: int = 3) -> List[Dict[str, float]]:
    """
    Apply simple moving average noise reduction to normalized data
    Data format: [{x: float, timestamp: float}, ...]
    """
    if len(data) < window_size:
        return data
    
    smoothed_data = []
    
    for i in range(len(data)):
        start_idx = max(0, i - window_size // 2)
        end_idx = min(len(data), i + window_size // 2 + 1)
        window = data[start_idx:end_idx]
        
        # Calculate average X position
        x_values = [point['x'] for point in window]
        avg_x = sum(x_values) / len(x_values)
        
        smoothed_data.append({
            'timestamp': data[i]['timestamp'],
            'x': avg_x
        })
    
    return smoothed_data 