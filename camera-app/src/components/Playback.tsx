import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppSelector } from '../store/hooks'

interface PlaybackProps {
  onStartNewSession: () => void
  onExit: () => void
}

export default function Playback({ onStartNewSession, onExit }: PlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)

  const { positions: eyePositions } = useAppSelector(state => state.eyeTracking)

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
        <button onClick={onStartNewSession} className="primary-btn">
          Start New Tracking Session
        </button>
        <button onClick={onExit} className="secondary-btn">
          Exit Application
        </button>
      </div>
    </div>
  )
} 