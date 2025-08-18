import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchAllSessions, fetchRecordingData, setSelectedSession, setSelectedRecording } from '../store/playbackSlice'
import { averageEyeSpeed } from '../utils/positionCalculations'
import type { Session, Recording } from '../types'

export default function PlaybackTab() {
  const dispatch = useAppDispatch()
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(100)
  const [useNoiseReduction, setUseNoiseReduction] = useState(true)

  const { sessions, selectedSession, selectedRecording, recordingData, isLoading, error } = useAppSelector(state => state.playback)

  // Fetch sessions on component mount
  useEffect(() => {
    dispatch(fetchAllSessions())
  }, [dispatch])

  // Range controls
  const handleRangeStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseInt(event.target.value)
    setRangeStart(Math.min(newStart, rangeEnd - 1))
  }

  const handleRangeEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseInt(event.target.value)
    setRangeEnd(Math.max(newEnd, rangeStart + 1))
  }

  const handleSessionSelect = (session: Session) => {
    dispatch(setSelectedSession(session))
  }

  const handleRecordingSelect = async (recording: Recording) => {
    dispatch(setSelectedRecording(recording))
    
    // Fetch the recording data
    await dispatch(fetchRecordingData({
      sessionId: recording.session_id,
      recordingNumber: recording.recording_number,
      eye: 'left',
      noiseReduction: useNoiseReduction
    }))
  }

  const handleBackToSelection = () => {
    dispatch(setSelectedRecording(null))
  }



  const handleNoiseReductionChange = async (noiseReduction: boolean) => {
    setUseNoiseReduction(noiseReduction)
    if (selectedRecording) {
      // Fetch the recording data with noise reduction setting
      await dispatch(fetchRecordingData({
        sessionId: selectedRecording.session_id,
        recordingNumber: selectedRecording.recording_number,
        eye: 'left',
        noiseReduction: noiseReduction
      }))
    }
  }



  // Get data for the selected range
  const getRangeData = () => {
    if (recordingData.length === 0) return []
    
    const startIndex = Math.floor((rangeStart / 100) * recordingData.length)
    const endIndex = Math.floor((rangeEnd / 100) * recordingData.length)
    
    return recordingData.slice(startIndex, endIndex).map((pos) => ({
      time: (pos.timestamp - recordingData[0].timestamp) / 1000, // Convert to seconds from epoch
      x: pos.x,
      timestamp: pos.timestamp
    }))
  }

  const rangeData = getRangeData()

  const currentRangeDataPoints = rangeData.length
  const currentRangeDuration = currentRangeDataPoints > 1
    ? (rangeData[currentRangeDataPoints - 1].time - rangeData[0].time)
    : 0
  const currentRangeAverageSpeed = averageEyeSpeed(rangeData)

  const formatRangeDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const downloadCSV = () => {
    if (rangeData.length === 0) return

    // Create CSV content
    const csvHeaders = 'Time (seconds),X Position (normalized),Timestamp\n'
    const csvRows = rangeData.map(point => 
      `${point.time.toFixed(3)},${point.x.toFixed(6)},${point.timestamp}`
    ).join('\n')
    const csvContent = csvHeaders + csvRows

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `eye-tracking-session-${selectedRecording?.session_id.split('-')[1]}-recording-${selectedRecording?.recording_number}-${formatTimestamp(Date.now()).replace(/[/:]/g, '-')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
              <div className="playback-options">
                <div className="range-stats">
                  <p>Range Duration: {formatRangeDuration(currentRangeDuration)} | Range Data Points: {currentRangeDataPoints.toLocaleString()} | Avg Speed: {currentRangeAverageSpeed.toFixed(3)} units/s</p>
                </div>

                
                <div className="option-group">
                  <label htmlFor="noise-reduction-toggle">Noise reduction:</label>
                  <input
                    type="checkbox"
                    id="noise-reduction-toggle"
                    checked={useNoiseReduction}
                    onChange={(e) => handleNoiseReductionChange(e.target.checked)}
                    className="option-checkbox"
                  />
                </div>
                
                <div className="option-group">
                  <button 
                    onClick={downloadCSV}
                    disabled={rangeData.length === 0}
                    className="download-btn"
                    title="Download current range data as CSV"
                  >
                    📥 Download CSV
                  </button>
                </div>
              </div>
              
              <div className="chart-container">
                <h3>Left Eye Tracking Playback (X-Axis Position)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={rangeData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f7fafc" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -10 }}
                      tickFormatter={(value) => value.toFixed(2)}
                      tick={{ fontSize: 12, fill: '#4a5568' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      label={{ value: 'X Position (normalized)', angle: -90, position: 'insideLeft' }}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      tickFormatter={(value) => value.toFixed(2)}
                      tick={{ fontSize: 12, fill: '#4a5568' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip 
                      formatter={(value) => [value, 'X Position']}
                      labelFormatter={(label) => `Time: ${label.toFixed(2)}s`}
                    />
                    <Area 
                      isAnimationActive={false}
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
              
              <div className="range-controls">
                <div className="range-group">
                  <label htmlFor="range-start">Range Start: {rangeStart}%</label>
                  <input
                    type="range"
                    id="range-start"
                    min="0"
                    max="100"
                    value={rangeStart}
                    onChange={handleRangeStartChange}
                    className="range-slider"
                  />
                </div>
                
                <div className="range-group">
                  <label htmlFor="range-end">Range End: {rangeEnd}%</label>
                  <input
                    type="range"
                    id="range-end"
                    min="0"
                    max="100"
                    value={rangeEnd}
                    onChange={handleRangeEndChange}
                    className="range-slider"
                  />
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
                    {[...session.recordings]
                      .sort((a, b) => a.timestamp - b.timestamp) 
                      .map((recording) => (
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