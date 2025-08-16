import { useAppSelector, useAppDispatch } from './store/hooks'
import { startVideoStream, stopVideoStream } from './store/videoStreamSlice'
import { connectWebSocket, disconnectWebSocket } from './store/webSocketSlice'
import { setCurrentStep, resetApp } from './store/appSlice'
import Calibration from './components/Calibration'
import LiveTracking from './components/LiveTracking'
import Playback from './components/Playback'
import './App.css'

function App() {
  const dispatch = useAppDispatch()
  const { currentStep } = useAppSelector(state => state.app)
  const { isActive: isCameraActive, error } = useAppSelector(state => state.videoStream)
  const { isConnected: isWebSocketConnected } = useAppSelector(state => state.webSocket)

  const handleStartCamera = async () => {
    try {
      await dispatch(startVideoStream()).unwrap()
      await dispatch(connectWebSocket()).unwrap()
      dispatch(setCurrentStep('calibration'))
    } catch (error) {
      console.error('Failed to start camera:', error)
    }
  }

  const handleStopCamera = async () => {
    try {
      await dispatch(stopVideoStream()).unwrap()
      await dispatch(disconnectWebSocket()).unwrap()
      dispatch(resetApp())
    } catch (error) {
      console.error('Failed to stop camera:', error)
    }
  }

  const handleCalibrationComplete = () => {
    dispatch(setCurrentStep('tracking'))
  }

  const handleStopTracking = () => {
    dispatch(setCurrentStep('playback'))
  }

  const handleStartNewSession = () => {
    dispatch(setCurrentStep('calibration'))
  }

  const handleExit = () => {
    handleStopCamera()
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Eye Tracking App</h1>
        <div className="step-indicator">
          <div className={`step ${currentStep === 'permission' ? 'active' : ''}`}>1. Permission</div>
          <div className={`step ${currentStep === 'calibration' ? 'active' : ''}`}>2. Calibration</div>
          <div className={`step ${currentStep === 'tracking' ? 'active' : ''}`}>3. Tracking</div>
          <div className={`step ${currentStep === 'playback' ? 'active' : ''}`}>4. Playback</div>
        </div>
        <div className="status-indicators">
          <div className={`status ${isCameraActive ? 'active' : 'inactive'}`}>
            📹 Camera: {isCameraActive ? 'Active' : 'Inactive'}
          </div>
          <div className={`status ${isWebSocketConnected ? 'active' : 'inactive'}`}>
            🌐 WebSocket: {isWebSocketConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>
      
      <main className="App-main">
        {currentStep === 'permission' && renderPermissionStep()}
        {currentStep === 'tracking' && (
          <LiveTracking onStopTracking={handleStopTracking} />
        )}
        {currentStep === 'playback' && (
          <Playback 
            onStartNewSession={handleStartNewSession}
            onExit={handleExit}
          />
        )}
      </main>
      
      {/* Calibration renders as full-screen overlay */}
      {currentStep === 'calibration' && (
        <Calibration onCalibrationComplete={handleCalibrationComplete} />
      )}
    </div>
  )
}

export default App
