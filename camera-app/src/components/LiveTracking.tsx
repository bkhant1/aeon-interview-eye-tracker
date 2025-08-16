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

  // Get live data for the last 10 seconds with fixed window
  const getLiveData = () => {
    if (eyePositions.length === 0) return []
    
    const tenSecondsAgo = Date.now() - 10000 // 10 seconds ago
    const recentPositions = eyePositions.filter(pos => pos.timestamp >= tenSecondsAgo)
    
    // Create fixed 10-second window with evenly spaced data points
    const windowSize = 10 // 10 seconds
    const dataPoints = []
    
    for (let i = 0; i < windowSize; i++) {
      const targetTime = tenSecondsAgo + (i * 1000) // Each second
      const closestPosition = recentPositions.reduce((closest, pos) => {
        return Math.abs(pos.timestamp - targetTime) < Math.abs(closest.timestamp - targetTime) ? pos : closest
      }, recentPositions[0] || { x: 0, y: 0, timestamp: targetTime })
      
      dataPoints.push({
        time: i,
        x: closestPosition.x,
        timestamp: targetTime
      })
    }
    
    return dataPoints
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
          <span className="stat-label">Current X Position:</span>
          <span className="stat-value">{latestPos.x.toFixed(1)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Points Tracked:</span>
          <span className="stat-value">{eyePositions.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Window Size:</span>
          <span className="stat-value">10s Fixed</span>
        </div>
      </div>
      
      <div className="live-chart-container">
        <h3>Live X-Axis Tracking (Fixed 10s Window)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={liveData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -15 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'X Position', angle: -90, position: 'insideLeft', offset: 0 }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value, name) => [value, 'X Position']}
              labelFormatter={(label) => `Time: ${label}s`}
            />
            <Area 
              type="monotone" 
              dataKey="x" 
              stroke="#667eea" 
              fill="#667eea" 
              fillOpacity={0.3}
              name="X Position"
              strokeWidth={2}
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