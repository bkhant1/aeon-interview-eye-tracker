import type { EyePosition, EyeLandmark } from "../types"

export const getEuclideanDistance = (point1: EyeLandmark, point2: EyeLandmark): number => {
  const dx = point1.x - point2.x
  const dy = point1.y - point2.y
  const dz = point1.z - point2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export const calculateEyesNormalizedRelativePosition = (eyePosition: EyePosition, calibrationPoints: EyePosition[]) => {
  const leftEye = eyePosition.leftEye

  if (!leftEye || calibrationPoints.length === 0) {
    return null
  }

  // Find the leftmost and rightmost calibration points based on eye corner distances
  const leftmostCalibration = calibrationPoints[0]

  if (!leftmostCalibration.leftEye) {
    return null
  }

  const leftCornerMinDistance = getEuclideanDistance(leftmostCalibration.leftEye.center, leftmostCalibration.leftEye.corners[0])
  const rightCornerMaxDistance = getEuclideanDistance(leftmostCalibration.leftEye.center, leftmostCalibration.leftEye.corners[1])

  const range = rightCornerMaxDistance - leftCornerMinDistance

  const currentLeftCornerDistance = getEuclideanDistance(leftEye.center, leftEye.corners[0])
  const relativePosition = 2 * ((currentLeftCornerDistance - leftCornerMinDistance) / range - 0.5)

  return relativePosition
}

export const averageEyeSpeed = (data: Array<{x: number, timestamp: number}>): number => {
  /**
   * Calculate average eye movement speed from normalized data
   * Data format: [{x: number, timestamp: number}, ...]
   * Returns: Average speed in units per second
   */
  if (data.length < 2) {
    return 0.0
  }
  
  let totalDistance = 0.0
  let totalTime = 0.0
  
  for (let i = 1; i < data.length; i++) {
    // Calculate distance between consecutive points
    const distance = Math.abs(data[i].x - data[i-1].x)
    totalDistance += distance
    
    // Calculate time difference in seconds
    const timeDiff = (data[i].timestamp - data[i-1].timestamp) / 1000.0
    totalTime += timeDiff
  }
  
  if (totalTime === 0) {
    return 0.0
  }
  
  return totalDistance / totalTime
}