import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchAllSessions, fetchRecordingData, setSelectedSession, setSelectedRecording } from '../store/playbackSlice'
import { calculateEyesNormalizedRelativePosition } from '../utils/positionCalculations'

export default function PlaybackTab() {
  const dispatch = useAppDispatch()
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)

  const { sessions, selectedSession, selectedRecording, recordingData, isLoading, error } = useAppSelector(state => state.playback)
  const calibrationPoints = useAppSelector(state => state.app.calibrationPoints)

  // Fetch sessions on component mount
  useEffect(() => {
    dispatch(fetchAllSessions())
  }, [dispatch])

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

  const handleSessionSelect = (session: any) => {
    dispatch(setSelectedSession(session))
  }

  const handleRecordingSelect = async (recording: any) => {
    dispatch(setSelectedRecording(recording))
    setCurrentTimeIndex(0)
    setIsPlaying(false)
    
    // Fetch the recording data
    await dispatch(fetchRecordingData({
      sessionId: recording.session_id,
      recordingNumber: recording.recording_number
    }))
  }

  const handleBackToSelection = () => {
    dispatch(setSelectedRecording(null))
    setCurrentTimeIndex(0)
    setIsPlaying(false)
  }

  // Playback effect
  useEffect(() => {
    if (isPlaying && recordingData.length > 0) {
      const interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          const next = prev + playbackSpeed
          if (next >= recordingData.length) {
            setIsPlaying(false)
            return recordingData.length - 1
          }
          return next
        })
      }, 100) // Update every 100ms

      return () => clearInterval(interval)
    }
  }, [isPlaying, playbackSpeed, recordingData.length])

  // Get current playback data
  const getCurrentPlaybackData = () => {
    if (recordingData.length === 0 || calibrationPoints.length === 0) return []
    
    const endIndex = Math.min(currentTimeIndex + 1, recordingData.length)
    return recordingData.slice(0, endIndex).map((pos, index) => {
      const relativePosition = calculateEyesNormalizedRelativePosition(pos, calibrationPoints)
      return {
        time: index,
        x: relativePosition !== null ? relativePosition : 0,
        timestamp: pos.timestamp
      }
    })
  }

  // Get current position for stats
  const getCurrentPosition = () => {
    if (recordingData.length === 0 || currentTimeIndex >= recordingData.length) {
      return { x: 0, y: 0 }
    }
    const currentPos = recordingData[currentTimeIndex]
    const relativePosition = calculateEyesNormalizedRelativePosition(currentPos, calibrationPoints)
    return {
      x: relativePosition !== null ? relativePosition : 0,
      y: 0 // We're only tracking X position for now
    }
  }

  const currentPos = getCurrentPosition()
  const playbackData = getCurrentPlaybackData()

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // If a recording is selected, show full playback view
  if (selectedRecording) {
    return (
      <div className="playback-tab">
        <div className="playback-header">
          <div className="playback-header-content">
            <button onClick={handleBackToSelection} className="back-btn">
              ← Back to Recordings
            </button>
            <h2>Playing: Session {selectedRecording.session_id.split('-')[1]} - Recording #{selectedRecording.recording_number}</h2>
          </div>
        </div>
        
        <div className="playback-full-view">
          {isLoading ? (
            <div className="loading">
              <p>Loading recording data...</p>
            </div>
          ) : (
            <>
              <div className="playback-info">
                <p>Duration: {formatDuration(selectedRecording.duration)} | Data Points: {selectedRecording.data_points.toLocaleString()}</p>
              </div>
              
              <div className="chart-container">
                <h3>Eye Tracking Playback (X-Axis Position)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={playbackData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (data points)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'X Position (normalized)', angle: -90, position: 'insideLeft' }}
                      domain={[-2, 2]}
                    />
                    <Tooltip 
                      formatter={(value, _name) => [value, 'X Position']}
                      labelFormatter={(label) => `Data Point: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="x" 
                      stroke="#667eea" 
                      fill="#667eea" 
                      fillOpacity={0.3}
                      name="X Position"
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                  max={Math.max(0, recordingData.length - 1)}
                  value={currentTimeIndex}
                  onChange={handleTimelineChange}
                  className="timeline-slider"
                />
                <div className="timeline-labels">
                  <span>Start</span>
                  <span>End</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Show selection view
  return (
    <div className="playback-tab">
      <div className="playback-header">
        <h2>Select Recording to Play</h2>
      </div>
      
      <div className="selection-view">
        {isLoading && sessions.length === 0 ? (
          <div className="loading">
            <p>Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>Error: {error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="no-recordings">
            <p>No recordings available</p>
            <p>Start a recording session to see data here</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session) => (
              <div key={session.session_id} className="session-group">
                <div 
                  className={`session-header ${selectedSession?.session_id === session.session_id ? 'selected' : ''}`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <span className="session-title">Session {session.session_id.split('-')[1]}</span>
                  <span className="session-count">{session.recordings.length} recordings</span>
                </div>
                
                {selectedSession?.session_id === session.session_id && (
                  <div className="recordings-list">
                    {session.recordings.map((recording) => (
                      <div 
                        key={`${recording.session_id}-${recording.recording_number}`}
                        className="recording-item"
                        onClick={() => handleRecordingSelect(recording)}
                      >
                        <div className="recording-header">
                          <span className="recording-title">Recording #{recording.recording_number}</span>
                        </div>
                        <div className="recording-details">
                          <div className="detail">
                            <span className="label">Date:</span>
                            <span className="value">{formatTimestamp(recording.timestamp)}</span>
                          </div>
                          <div className="detail">
                            <span className="label">Duration:</span>
                            <span className="value">{formatDuration(recording.duration)}</span>
                          </div>
                          <div className="detail">
                            <span className="label">Data Points:</span>
                            <span className="value">{recording.data_points.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 