import { useState, useRef, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { processVideoFrame, startTracking, stopTracking, clearPositions } from '../store/eyeTrackingSlice'
import { sendWebSocketMessage } from '../store/webSocketSlice'
import type { EyePosition } from '../types'

interface LiveTrackingProps {
  onStopTracking: () => void
}

export default function LiveTracking({ onStopTracking }: LiveTrackingProps) {
  const dispatch = useAppDispatch()
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationRef = useRef<number | null>(null)
  
  const { stream } = useAppSelector(state => state.videoStream)
  const { positions: eyePositions, isTracking, currentPosition } = useAppSelector(state => state.eyeTracking)

  const startEyeTracking = useCallback(() => {
    if (!stream) return
    
    const trackEyes = () => {
      if (stream && isTracking) {
        dispatch(processVideoFrame(stream))
      }
      
      animationRef.current = requestAnimationFrame(trackEyes)
    }
    
    trackEyes()
  }, [stream, isTracking, dispatch])

  const handleStartTracking = () => {
    dispatch(startTracking())
  }

  const handlePauseTracking = () => {
    dispatch(stopTracking())
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  const handleResetTracking = () => {
    dispatch(clearPositions())
    dispatch(stopTracking())
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  // Send WebSocket messages when currentPosition changes
  useEffect(() => {
    if (currentPosition && isTracking) {
      dispatch(sendWebSocketMessage({
        type: 'eye_position',
        data: currentPosition,
        timestamp: Date.now()
      }))
    }
  }, [currentPosition, isTracking, dispatch])

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

  // Get latest position for live tracking
  const getLatestPosition = () => {
    if (eyePositions.length === 0) {
      return { x: 0, y: 0 }
    }
    return eyePositions[eyePositions.length - 1]
  }

  const handleStopTracking = () => {
    dispatch(stopTracking())
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    onStopTracking()
  }

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    if (isTracking) {
      startEyeTracking()
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isTracking, startEyeTracking])

  const latestPos = getLatestPosition()
  const liveData = getLiveData()

  return (
    <div className="step-container">
      <h2>Eye Tracking Active</h2>
      <p>Your eye movements are being tracked in real-time.</p>
      
      <div className="tracking-controls">
        <div className="control-group">
          {!isTracking ? (
            <button onClick={handleStartTracking} className="control-btn play">
              ▶️ Start Tracking
            </button>
          ) : (
            <button onClick={handlePauseTracking} className="control-btn pause">
              ⏸️ Pause Tracking
            </button>
          )}
          <button onClick={handleResetTracking} className="control-btn reset">
            🔄 Reset Data
          </button>
        </div>
        
        <div className="tracking-status">
          <div className={`status-indicator ${isTracking ? 'active' : 'inactive'}`}>
            {isTracking ? '🟢 Tracking Active' : '🔴 Tracking Paused'}
          </div>
        </div>
      </div>
      
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
      
      <button onClick={handleStopTracking} className="secondary-btn">
        Stop Tracking & View Playback
      </button>
      
      {/* Hidden video element for camera access */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
    </div>
  )
} 