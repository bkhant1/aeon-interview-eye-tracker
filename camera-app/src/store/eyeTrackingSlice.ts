import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { EyePosition } from '../types'

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

export const processVideoFrame = createAsyncThunk(
  'eyeTracking/processFrame',
  async (stream: MediaStream) => {
    // Mock processing - in real implementation, this would analyze the video frame
    const position = mockEyeTracking(stream)
    return position
  }
)

export const startTracking = createAsyncThunk(
  'eyeTracking/start',
  async () => {
    return true
  }
)

export const stopTracking = createAsyncThunk(
  'eyeTracking/stop',
  async () => {
    return false
  }
)

const eyeTrackingSlice = createSlice({
  name: 'eyeTracking',
  initialState: {
    positions: [] as EyePosition[],
    isTracking: false,
    currentPosition: null as EyePosition | null,
  },
  reducers: {
    addPosition: (state, action: PayloadAction<EyePosition>) => {
      state.positions.push(action.payload)
      state.currentPosition = action.payload
      // Keep only last 500 positions for performance
      if (state.positions.length > 500) {
        state.positions = state.positions.slice(-500)
      }
    },
    clearPositions: (state) => {
      state.positions = []
      state.currentPosition = null
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processVideoFrame.fulfilled, (state, action) => {
        state.currentPosition = action.payload
        state.positions.push(action.payload)
        // Keep only last 500 positions for performance
        if (state.positions.length > 500) {
          state.positions = state.positions.slice(-500)
        }
      })
      .addCase(startTracking.fulfilled, (state) => {
        state.isTracking = true
      })
      .addCase(stopTracking.fulfilled, (state) => {
        state.isTracking = false
      })
  },
})

// WebSocket messages will be handled in the component layer to avoid circular dependencies

export const { addPosition, clearPositions, setTracking } = eyeTrackingSlice.actions
export default eyeTrackingSlice.reducer 