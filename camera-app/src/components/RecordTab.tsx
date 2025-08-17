import { useAppSelector, useAppDispatch } from '../store/hooks'
import { startVideoStream, stopVideoStream } from '../store/videoStreamSlice'
import { setCurrentStep, resetApp, generateNewSessionId } from '../store/appSlice'
import { stopTracking, clearPositions, setRecording } from '../store/eyeTrackingSlice'
import Calibration from './Calibration'
import LiveTracking from './LiveTracking'
import WebcamDebugger from './WebcamDebugger'

export default function RecordTab() {
  const dispatch = useAppDispatch()
  const { currentStep } = useAppSelector(state => state.app)
  const { isActive: isCameraActive, error, stream } = useAppSelector(state => state.videoStream)

  const handleStartCamera = async () => {
    try {
      await dispatch(startVideoStream()).unwrap()
      dispatch(setCurrentStep('calibration'))
    } catch (error) {
      console.error('Failed to start camera:', error)
    }
  }

  const handleCalibrationComplete = () => {
    dispatch(setCurrentStep('tracking'))
  }

  const handleStopTracking = async () => {
    try {
      // Stop eye tracking
      await dispatch(stopTracking()).unwrap()
      
      // Stop recording if it's active
      dispatch(setRecording(false))
      
      // Clear all tracking data
      dispatch(clearPositions())
      
      // Stop the camera
      await dispatch(stopVideoStream()).unwrap()
      
      // Generate a new session ID for the next session
      dispatch(generateNewSessionId())
      
      // Show completion message
      dispatch(setCurrentStep('tracking-complete'))
    } catch (error) {
      console.error('Failed to stop tracking session:', error)
      // Still show completion message even if there was an error
      dispatch(setCurrentStep('tracking-complete'))
    }
  }

  const handleStartNewSession = () => {
    // Clear any remaining tracking data
    dispatch(clearPositions())
    dispatch(setRecording(false))
    
    // Reset to permission step to start fresh
    dispatch(setCurrentStep('permission'))
  }

  const renderPermissionStep = () => (
    <div className="step-container">
      <h2>Camera Permission Required</h2>
      <p>This eye tracking app needs access to your camera to function properly.</p>
      <button onClick={handleStartCamera} className="primary-btn">
        Grant Camera Permission
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  )

  const renderTrackingComplete = () => (
    <div className="step-container">
      <h2>Recording Complete!</h2>
      <p>Your eye tracking session has been recorded and saved.</p>
      <div className="tracking-actions">
        <button onClick={handleStartNewSession} className="primary-btn">
          Start New Recording Session
        </button>
      </div>
    </div>
  )

  return (
    <div className="record-tab">
      <div className="record-content">
        {currentStep === 'permission' && renderPermissionStep()}
        {currentStep === 'tracking' && (
          <LiveTracking onStopTracking={handleStopTracking} />
        )}
        {currentStep === 'tracking-complete' && renderTrackingComplete()}
      </div>
      
      {/* Calibration renders as full-screen overlay */}
      {currentStep === 'calibration' && (
        <Calibration onCalibrationComplete={handleCalibrationComplete} />
      )}
      
      {/* Global Webcam Debugger - only show when camera is active */}
      {isCameraActive && <WebcamDebugger stream={stream} />}
    </div>
  )
} 