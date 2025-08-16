import { useState, useEffect } from 'react'
import { useAppDispatch } from '../store/hooks'
import { addCalibrationPoint } from '../store/appSlice'
import { sendWebSocketMessage } from '../store/webSocketSlice'

interface CalibrationProps {
  onCalibrationComplete: () => void
}

export default function Calibration({ onCalibrationComplete }: CalibrationProps) {
  const dispatch = useAppDispatch()
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState<number>(0)

  const calibrationTargets = [
    { x: 10, y: 10 },   // Top-left
    { x: 90, y: 10 },   // Top-right
    { x: 10, y: 90 },   // Bottom-left
    { x: 90, y: 90 },   // Bottom-right
    { x: 50, y: 50 },   // Center
  ];

  const captureCalibrationPoint = () => {
    // Mock calibration point capture
    const mockPosition = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100
    }
    
    // Add to Redux state
    dispatch(addCalibrationPoint(mockPosition))
    
    // Send WebSocket message
    dispatch(sendWebSocketMessage({
      type: 'calibration',
      data: { point: currentCalibrationPoint + 1, position: mockPosition },
      timestamp: Date.now()
    }))
    
    if (currentCalibrationPoint < calibrationTargets.length - 1) {
      setCurrentCalibrationPoint(prev => prev + 1)
    } else {
      // Calibration complete
      onCalibrationComplete()
    }
  }

  // Handle spacebar press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault() // Prevent page scroll
        captureCalibrationPoint()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentCalibrationPoint])

  return (
    <div className="calibration-fullscreen">
      {/* Instructions at top only */}
      <div className="calibration-header-simple">
        <h2>Eye Tracking Calibration</h2>
        <p>Look at the red dot and press <strong>SPACEBAR</strong> when ready</p>
      </div>

      {/* Calibration target - positioned absolutely */}
      <div 
        className="calibration-target-fullscreen" 
        style={{
          left: `${calibrationTargets[currentCalibrationPoint].x}%`,
          top: `${calibrationTargets[currentCalibrationPoint].y}%`
        }}
      >
        <div className="target-dot-large"></div>
        <div className="target-pulse"></div>
      </div>
    </div>
  )
} 