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
  const relativePosition = (currentLeftCornerDistance - leftCornerMinDistance) / range

  return relativePosition
}