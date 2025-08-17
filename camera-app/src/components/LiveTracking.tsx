import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setRecording, clearRecordingBuffer } from '../store/eyeTrackingSlice'
import { calculateEyesNormalizedRelativePosition } from '../utils/positionCalculations'

interface LiveTrackingProps {
  onStopTracking: () => void
}

// Helper function to generate ticks for the axes
const generateTicks = (start: number, end: number, step: number): number[] => {
  const ticks = [];
  for (let i = start; i <= end; i += step) {
    ticks.push(i);
  }
  return ticks;
};

export default function LiveTracking({ onStopTracking }: LiveTrackingProps) {
  const dispatch = useAppDispatch()

  const { positions: eyePositions, isTracking, isRecording, recordingBuffer } = useAppSelector(state => state.eyeTracking)
  const calibrationPoints = useAppSelector(state => state.app.calibrationPoints)
  
  const handleStartRecording = () => {
    dispatch(setRecording(true))
  }

  const handleStopRecording = () => {
    dispatch(setRecording(false))
  }

  const handleClearRecording = () => {
    dispatch(clearRecordingBuffer())
  }

  const getLiveData = () => {
    if (eyePositions.length === 0 || calibrationPoints.length === 0) return []

    const now = Date.now()
    const tenSecondsAgo = now - 10000

    // 1. Filter for all data points within the last 10 seconds
    const recentPositions = eyePositions.filter(pos => pos.timestamp >= tenSecondsAgo)

    // 2. Map each point to the fixed [-10, 0] time domain
    return recentPositions.map(pos => {
      const relativePosition = calculateEyesNormalizedRelativePosition(pos, calibrationPoints)
      return {
        // Calculate time relative to now (e.g., a point from 2s ago will be -2)
        time: (pos.timestamp - now) / 1000,
        x: relativePosition !== null ? relativePosition : 0,
      }
    })
  }

  const getLatestPosition = () => {
    const latestPosition = eyePositions[eyePositions.length - 1]
    if (!latestPosition) {
      return null
    }
    const relativePosition = calculateEyesNormalizedRelativePosition(latestPosition, calibrationPoints)
    return relativePosition
  }

  const handleStopTracking = () => {
    if (isRecording) {
      dispatch(setRecording(false))
    }
    onStopTracking()
  }

  const latestPos = getLatestPosition()
  const liveData = getLiveData()

  // Define the fixed ticks for our axes
  const xTicks = generateTicks(-10, 0, 1); // -10, -9, -8, ..., 0
  const yTicks = generateTicks(-2, 2, 0.5); // -2, -1.5, -1, ..., 2

  return (
    <div className="step-container">
      <h2>Eye Tracking Active</h2>
      <p>Your eye movements are being tracked in real-time using MediaPipe iris detection. Use the webcam debugger in the bottom left to see your camera feed.</p>

      <div className="tracking-controls">
        <div className="control-group">
          {!isRecording ? (
            <button onClick={handleStartRecording} className="control-btn play">
              🔴 Start Recording
            </button>
          ) : (
            <button onClick={handleStopRecording} className="control-btn pause">
              ⏹️ Stop Recording
            </button>
          )}
          <button onClick={handleClearRecording} className="control-btn reset">
            🗑️ Clear Recording Buffer
          </button>
        </div>

        <div className="tracking-status">
          <div className={`status-indicator ${isTracking ? 'active' : 'inactive'}`}>
            {isTracking ? '🟢 Tracking Active' : '🔴 Tracking Paused'}
          </div>
          <div className={`status-indicator ${isRecording ? 'active' : 'inactive'}`}>
            {isRecording ? '🔴 Recording Active' : '⚪ Recording Paused'}
          </div>

        </div>
      </div>

      <div className="tracking-stats">
        <div className="stat">
          <span className="stat-label">Current X Position:</span>
          <span className="stat-value">{latestPos?.toFixed(3)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Current Y Position:</span>
          <span className="stat-value">{latestPos?.toFixed(3)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Points Tracked:</span>
          <span className="stat-value">{eyePositions.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Recording Buffer:</span>
          <span className="stat-value">{recordingBuffer.length}</span>
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
              type="number" // Important for a numerical domain
              dataKey="time"
              label={{ value: 'Time (seconds ago)', position: 'insideBottom', offset: -15 }}
              tick={{ fontSize: 12 }}
              // --- KEY CHANGES FOR X-AXIS ---
              domain={[-10, 0]}
              ticks={xTicks}
              allowDataOverflow={true}
            />
            <YAxis
              label={{ value: 'X Position', angle: -90, position: 'insideLeft', offset: 0 }}
              tick={{ fontSize: 12 }}
              // --- KEY CHANGES FOR Y-AXIS ---
              domain={[-2, 2]}
              ticks={yTicks}
              allowDataOverflow={true}
            />
            <Tooltip
              formatter={(value) => [value, 'X Position']}
              labelFormatter={(label) => `Time: ${label.toFixed(2)}s ago`}
            />
            <Area
              isAnimationActive={false} // Improves performance for live data
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
    </div>
  )
} 