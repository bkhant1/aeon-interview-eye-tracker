import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addCalibrationPoint, sendCalibrationData } from '../store/appSlice'

interface CalibrationProps {
  onCalibrationComplete: () => void
}

export default function Calibration({ onCalibrationComplete }: CalibrationProps) {
  const dispatch = useAppDispatch()
  const currentEyePosition = useAppSelector(state => state.eyeTracking.currentPosition)
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState<number>(0)

  const calibrationSteps = [
    { 
      instruction: "By moving only your eyes, look as far LEFT as you can, then press SPACEBAR",
      label: "LEFT"
    },
    { 
      instruction: "By moving only your eyes, look straight AHEAD, then press SPACEBAR", 
      label: "CENTER"
    },
    { 
      instruction: "By moving only your eyes, look as far RIGHT as you can, then press SPACEBAR",
      label: "RIGHT"
    }
  ];

  const captureCalibrationPoint = () => {
    // Use actual eye tracking data if available, otherwise fall back to mock data
    const position = currentEyePosition 
      ? { x: currentEyePosition.x, y: currentEyePosition.y }
      : { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
    
    // Add to Redux state
    dispatch(addCalibrationPoint(position))

    if (currentCalibrationPoint < calibrationSteps.length - 1) {
      setCurrentCalibrationPoint(prev => prev + 1)
    } else {
      // Calibration complete - send data to backend via reducer
      dispatch(sendCalibrationData())
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

  const currentStep = calibrationSteps[currentCalibrationPoint]

  return (
    <div className="calibration-fullscreen">
      {/* Instructions */}
      <div className="calibration-header-simple">
        <h2>Eye Tracking Calibration</h2>
        <p className="calibration-reminder">Please face the camera and keep your head still</p>
        <p className="calibration-instruction">{currentStep.instruction}</p>
      </div>
    </div>
  )
} 