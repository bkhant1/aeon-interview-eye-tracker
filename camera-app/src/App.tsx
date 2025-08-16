import { useState, useRef, useEffect, useCallback } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentStep, setCurrentStep] = useState<'permission' | 'calibration' | 'tracking'>('permission')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [error, setError] = useState<string>('')
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([])
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState<number>(0)
  const [eyePositions, setEyePositions] = useState<EyePosition[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const animationRef = useRef<number | null>(null)

  const calibrationTargets = [
    { x: 50, y: 50 },   // Top-left
    { x: 50, y: 50 },   // Top-right
    { x: 50, y: 50 },   // Bottom-left
    { x: 50, y: 50 },   // Bottom-right
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

  // Remove unused function

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
    
    const trackEyes = () => {
      if (videoRef.current && videoRef.current.srcObject && isTracking) {
        const stream = videoRef.current.srcObject as MediaStream
        const position = mockEyeTracking(stream)
        
        setEyePositions(prev => {
          const newPositions = [...prev, position]
          // Keep only last 100 positions for performance
          return newPositions.slice(-100)
        })
      }
      
      animationRef.current = requestAnimationFrame(trackEyes)
    }
    
    trackEyes()
  }, [isTracking])

  const drawEyeTrackingGraph = () => {
    const canvas = canvasRef.current
    if (!canvas || eyePositions.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up graph area
    const padding = 40
    const graphWidth = canvas.width - 2 * padding
    const graphHeight = canvas.height - 2 * padding

    // Find min/max values for scaling
    const xValues = eyePositions.map(p => p.x)
    const yValues = eyePositions.map(p => p.y)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)

    // Draw grid
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * graphWidth
      const y = padding + (i / 10) * graphHeight
      
      // Vertical lines
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, canvas.height - padding)
      ctx.stroke()
      
      // Horizontal lines
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
    }

    // Draw eye tracking path
    if (eyePositions.length > 1) {
      ctx.strokeStyle = '#667eea'
      ctx.lineWidth = 3
      ctx.beginPath()
      
      eyePositions.forEach((pos, index) => {
        const x = padding + ((pos.x - minX) / (maxX - minX)) * graphWidth
        const y = padding + ((pos.y - minY) / (maxY - minY)) * graphHeight
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
    }

    // Draw current position
    if (eyePositions.length > 0) {
      const currentPos = eyePositions[eyePositions.length - 1]
      const x = padding + ((currentPos.x - minX) / (maxX - minX)) * graphWidth
      const y = padding + ((currentPos.y - minY) / (maxY - minY)) * graphHeight
      
      ctx.fillStyle = '#f56565'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw labels
    ctx.fillStyle = '#4a5568'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    
    // X-axis label
    ctx.fillText('X Position', canvas.width / 2, canvas.height - 10)
    
    // Y-axis label
    ctx.save()
    ctx.translate(15, canvas.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Y Position', 0, 0)
    ctx.restore()
  }

  useEffect(() => {
    if (currentStep === 'tracking' && eyePositions.length > 0) {
      drawEyeTrackingGraph()
    }
  }, [eyePositions, currentStep])

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

  const renderTrackingStep = () => (
    <div className="step-container">
      <h2>Eye Tracking Active</h2>
      <p>Your eye movements are being tracked in real-time.</p>
      
      <div className="tracking-stats">
        <div className="stat">
          <span className="stat-label">Current X:</span>
          <span className="stat-value">
            {eyePositions.length > 0 ? eyePositions[eyePositions.length - 1].x.toFixed(1) : '0.0'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Current Y:</span>
          <span className="stat-value">
            {eyePositions.length > 0 ? eyePositions[eyePositions.length - 1].y.toFixed(1) : '0.0'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Points Tracked:</span>
          <span className="stat-value">{eyePositions.length}</span>
        </div>
      </div>
      
      <div className="graph-container">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={400}
          className="eye-tracking-graph"
        />
      </div>
      
      <button onClick={stopCamera} className="secondary-btn">
        Stop Tracking
      </button>
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
        </div>
      </header>
      
      <main className="App-main">
        {currentStep === 'permission' && renderPermissionStep()}
        {currentStep === 'calibration' && renderCalibrationStep()}
        {currentStep === 'tracking' && renderTrackingStep()}
        
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
