import { useState, useRef, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import './App.css'

interface EyePosition {
  x: number;
  y: number;
  timestamp: number;
}

// Mock eye tracking function - will be replaced with real implementation later
const mockEyeTracking = (videoStream: MediaStream): EyePosition => {
  const now = Date.now();
  const time = now / 1000; // Convert to seconds
  return {
    x: Math.sin(time) * 100 + 200, // Sinusoidal movement in x
    y: Math.cos(time * 0.5) * 50 + 150, // Slower sinusoidal movement in y
    timestamp: now
  };
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentStep, setCurrentStep] = useState<'permission' | 'calibration' | 'tracking' | 'playback'>('permission')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [error, setError] = useState<string>('')
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([])
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState<number>(0)
  const [eyePositions, setEyePositions] = useState<EyePosition[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const animationRef = useRef<number | null>(null)
  
  // Playback controls
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)
  const [playbackStartTime, setPlaybackStartTime] = useState<number>(0)

  const calibrationTargets = [
    { x: 20, y: 20 },   // Top-left
    { x: 80, y: 20 },   // Top-right
    { x: 20, y: 80 },   // Bottom-left
    { x: 80, y: 80 },   // Bottom-right
    { x: 50, y: 50 },   // Center
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
        setError('')
        setCurrentStep('calibration')
      }
    } catch (err) {
      setError('Failed to access camera. Please make sure you have granted camera permissions.')
      console.error('Camera access error:', err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
      setIsTracking(false)
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const stopTracking = () => {
    setIsTracking(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setCurrentStep('playback')
    setCurrentTimeIndex(0)
    setIsPlaying(false)
  }

  const captureCalibrationPoint = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const mockPosition = mockEyeTracking(stream)
      
      setCalibrationPoints(prev => [...prev, { x: mockPosition.x, y: mockPosition.y }])
      
      if (currentCalibrationPoint < calibrationTargets.length - 1) {
        setCurrentCalibrationPoint(prev => prev + 1)
      } else {
        // Calibration complete
        setCurrentStep('tracking')
        startEyeTracking()
      }
    }
  }

  const startEyeTracking = useCallback(() => {
    setIsTracking(true)
    setEyePositions([])
    setPlaybackStartTime(Date.now())
    
    const trackEyes = () => {
      if (videoRef.current && videoRef.current.srcObject && isTracking) {
        const stream = videoRef.current.srcObject as MediaStream
        const position = mockEyeTracking(stream)
        
        setEyePositions(prev => {
          const newPositions = [...prev, position]
          // Keep more positions for playback
          return newPositions.slice(-500)
        })
      }
      
      animationRef.current = requestAnimationFrame(trackEyes)
    }
    
    trackEyes()
  }, [isTracking])

  // Get live data for the last 10 seconds
  const getLiveData = () => {
    if (eyePositions.length === 0) return []
    
    const tenSecondsAgo = Date.now() - 10000 // 10 seconds ago
    const recentPositions = eyePositions.filter(pos => pos.timestamp >= tenSecondsAgo)
    
    return recentPositions.map((pos, index) => ({
      time: index,
      x: pos.x,
      y: pos.y,
      timestamp: pos.timestamp
    }))
  }

  // Playback controls
  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const resetPlayback = () => {
    setCurrentTimeIndex(0)
    setIsPlaying(false)
  }

  const handleTimelineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(event.target.value)
    setCurrentTimeIndex(newIndex)
  }

  const handleSpeedChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaybackSpeed(parseFloat(event.target.value))
  }

  // Playback effect
  useEffect(() => {
    if (isPlaying && eyePositions.length > 0) {
      const interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          const next = prev + playbackSpeed
          if (next >= eyePositions.length) {
            setIsPlaying(false)
            return eyePositions.length - 1
          }
          return next
        })
      }, 100) // Update every 100ms

      return () => clearInterval(interval)
    }
  }, [isPlaying, playbackSpeed, eyePositions.length])

  // Get current playback data
  const getCurrentPlaybackData = () => {
    if (eyePositions.length === 0) return []
    
    const endIndex = Math.min(currentTimeIndex + 1, eyePositions.length)
    return eyePositions.slice(0, endIndex).map((pos, index) => ({
      time: index,
      x: pos.x,
      y: pos.y,
      timestamp: pos.timestamp
    }))
  }

  // Get current position for stats
  const getCurrentPosition = () => {
    if (eyePositions.length === 0 || currentTimeIndex >= eyePositions.length) {
      return { x: 0, y: 0 }
    }
    return eyePositions[currentTimeIndex]
  }

  // Get latest position for live tracking
  const getLatestPosition = () => {
    if (eyePositions.length === 0) {
      return { x: 0, y: 0 }
    }
    return eyePositions[eyePositions.length - 1]
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const renderPermissionStep = () => (
    <div className="step-container">
      <h2>Camera Permission Required</h2>
      <p>This eye tracking app needs access to your camera to function properly.</p>
      <button onClick={startCamera} className="primary-btn">
        Grant Camera Permission
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  )

  const renderCalibrationStep = () => (
    <div className="step-container">
      <h2>Eye Tracking Calibration</h2>
      <p>Please look at each calibration point and click "Capture" when you're ready.</p>
      
      <div className="calibration-container">
        <div className="calibration-target" style={{
          left: `${calibrationTargets[currentCalibrationPoint].x}%`,
          top: `${calibrationTargets[currentCalibrationPoint].y}%`
        }}>
          <div className="target-dot"></div>
        </div>
        
        <div className="calibration-progress">
          <p>Point {currentCalibrationPoint + 1} of {calibrationTargets.length}</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentCalibrationPoint + 1) / calibrationTargets.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <button onClick={captureCalibrationPoint} className="primary-btn">
          Capture Point
        </button>
      </div>
      
      <div className="calibration-points">
        <h3>Captured Points:</h3>
        {calibrationPoints.map((point, index) => (
          <div key={index} className="point-display">
            Point {index + 1}: ({point.x.toFixed(1)}, {point.y.toFixed(1)})
          </div>
        ))}
      </div>
    </div>
  )

  const renderTrackingStep = () => {
    const latestPos = getLatestPosition()
    const liveData = getLiveData()
    
    return (
      <div className="step-container">
        <h2>Eye Tracking Active</h2>
        <p>Your eye movements are being tracked in real-time.</p>
        
        <div className="tracking-stats">
          <div className="stat">
            <span className="stat-label">Current X:</span>
            <span className="stat-value">{latestPos.x.toFixed(1)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Current Y:</span>
            <span className="stat-value">{latestPos.y.toFixed(1)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Points Tracked:</span>
            <span className="stat-value">{eyePositions.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Live Data Points:</span>
            <span className="stat-value">{liveData.length}</span>
          </div>
        </div>
        
        <div className="live-chart-container">
          <h3>Live Tracking (Last 10 Seconds)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={liveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'Time (Last 10s)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [value, name === 'x' ? 'X Position' : 'Y Position']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="x" 
                stroke="#667eea" 
                fill="#667eea" 
                fillOpacity={0.3}
                name="X Position"
              />
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke="#f56565" 
                fill="#f56565" 
                fillOpacity={0.3}
                name="Y Position"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <button onClick={stopTracking} className="secondary-btn">
          Stop Tracking & View Playback
        </button>
      </div>
    )
  }

  const renderPlaybackStep = () => {
    const currentPos = getCurrentPosition()
    const playbackData = getCurrentPlaybackData()
    
    return (
      <div className="step-container">
        <h2>Eye Tracking Playback</h2>
        <p>Review your eye tracking session with playback controls.</p>
        
        <div className="tracking-stats">
          <div className="stat">
            <span className="stat-label">Current X:</span>
            <span className="stat-value">{currentPos.x.toFixed(1)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Current Y:</span>
            <span className="stat-value">{currentPos.y.toFixed(1)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Points:</span>
            <span className="stat-value">{eyePositions.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Playback Position:</span>
            <span className="stat-value">{currentTimeIndex + 1} / {eyePositions.length}</span>
          </div>
        </div>
        
        <div className="playback-controls">
          <div className="control-group">
            <button 
              onClick={togglePlayback} 
              className={`control-btn ${isPlaying ? 'pause' : 'play'}`}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button onClick={resetPlayback} className="control-btn reset">
              🔄 Reset
            </button>
          </div>
          
          <div className="control-group">
            <label htmlFor="speed-select">Speed:</label>
            <select 
              id="speed-select"
              value={playbackSpeed} 
              onChange={handleSpeedChange}
              className="speed-select"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
        </div>
        
        <div className="timeline-container">
          <input
            type="range"
            min="0"
            max={Math.max(0, eyePositions.length - 1)}
            value={currentTimeIndex}
            onChange={handleTimelineChange}
            className="timeline-slider"
          />
          <div className="timeline-labels">
            <span>Start</span>
            <span>End</span>
          </div>
        </div>
        
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={playbackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'Time', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [value, name === 'x' ? 'X Position' : 'Y Position']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="x" 
                stroke="#667eea" 
                fill="#667eea" 
                fillOpacity={0.3}
                name="X Position"
              />
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke="#f56565" 
                fill="#f56565" 
                fillOpacity={0.3}
                name="Y Position"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="playback-actions">
          <button onClick={() => setCurrentStep('tracking')} className="primary-btn">
            Start New Tracking Session
          </button>
          <button onClick={stopCamera} className="secondary-btn">
            Exit Application
          </button>
        </div>
      </div>
    )
  }

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
      </header>
      
      <main className="App-main">
        {currentStep === 'permission' && renderPermissionStep()}
        {currentStep === 'calibration' && renderCalibrationStep()}
        {currentStep === 'tracking' && renderTrackingStep()}
        {currentStep === 'playback' && renderPlaybackStep()}
        
        {/* Hidden video element for camera access */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
      </main>
    </div>
  )
}

export default App
