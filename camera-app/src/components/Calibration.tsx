import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addCalibrationPoint, sendCalibrationData } from '../store/appSlice'
import type { CalibrationPosition } from '../types'

interface CalibrationProps {
  onCalibrationComplete: () => void
}

export default function Calibration({ onCalibrationComplete }: CalibrationProps) {
  const dispatch = useAppDispatch()
  const currentEyeData = useAppSelector(state => state.eyeTracking.currentPosition)
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState<number>(0)
  const [showCameraError, setShowCameraError] = useState<boolean>(false)

  const calibrationSteps = useMemo(() => [
    { 
      instruction: "By moving only your eyes, look as far LEFT as you can, then press SPACEBAR",
      label: "LEFT",
      gaze_direction: 'left' as const
    },
    { 
      instruction: "By moving only your eyes, look straight AHEAD, then press SPACEBAR", 
      label: "CENTER",
      gaze_direction: 'center' as const
    },
    { 
      instruction: "By moving only your eyes, look as far RIGHT as you can, then press SPACEBAR",
      label: "RIGHT",
      gaze_direction: 'right' as const
    }
  ], []);

  const captureCalibrationPoint = useCallback(() => {
    // Check if we have valid eye data
    if (!currentEyeData) {
      setShowCameraError(true)
      return
    }
    console.log(currentEyeData)
    
    // Create calibration position with gaze direction
    const calibrationPosition: CalibrationPosition = {
      ...currentEyeData,
      gaze_direction: calibrationSteps[currentCalibrationPoint].gaze_direction
    }
    
    dispatch(addCalibrationPoint(calibrationPosition))

    if (currentCalibrationPoint < calibrationSteps.length - 1) {
      setCurrentCalibrationPoint(prev => prev + 1)
    } else {
      // Calibration complete - send data to backend via reducer
      dispatch(sendCalibrationData())
      onCalibrationComplete()
    }
  }, [currentEyeData, currentCalibrationPoint, dispatch, onCalibrationComplete, calibrationSteps])

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
  }, [currentCalibrationPoint, currentEyeData, captureCalibrationPoint])

  const currentStep = calibrationSteps[currentCalibrationPoint]

  // Show camera error message if no eye data is available
  if (showCameraError) {
    return (
      <div className="calibration-fullscreen">
        <div className="calibration-header-simple">
          <h2>Camera Issue Detected</h2>
          <p className="calibration-error">
            No eye tracking data is being received. Please:
          </p>
          <ul className="calibration-error-list">
            <li>Check that your camera is working properly</li>
            <li>Make sure your face is clearly visible in the camera</li>
            <li>Ensure good lighting conditions</li>
            <li>Try reloading the page</li>
          </ul>
          <button 
            className="calibration-reload-btn"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

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