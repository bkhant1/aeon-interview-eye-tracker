import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { EyePosition } from '../types'

// Constants
const POSITION_BUFFER_SIZE = 30;
const RECORDING_BUFFER_SIZE = 1000;

export const startTracking = createAsyncThunk(
  'eyeTracking/start',
  async (_stream: MediaStream) => {
    // For now, just return success - actual tracking will be handled by components
    return true;
  }
)

export const stopTracking = createAsyncThunk(
  'eyeTracking/stop',
  async () => {
    // For now, just return success - cleanup will be handled by components
    return false;
  }
)

const eyeTrackingSlice = createSlice({
  name: 'eyeTracking',
  initialState: {
    positions: [] as EyePosition[],
    isTracking: false,
    currentPosition: null as EyePosition | null,
    recordingBuffer: [] as EyePosition[],
    isRecording: false,
    showWebcamDebug: true, // New state for webcam debug visibility
  },
  reducers: {
    addPosition: (state, action: PayloadAction<EyePosition>) => {
      state.positions.push(action.payload)
      state.currentPosition = action.payload
      
      // Keep only last POSITION_BUFFER_SIZE positions for performance
      if (state.positions.length > POSITION_BUFFER_SIZE) {
        state.positions = state.positions.slice(-POSITION_BUFFER_SIZE)
      }
      
      // If recording, add to recording buffer
      if (state.isRecording) {
        state.recordingBuffer.push(action.payload)
        
        // Keep only last RECORDING_BUFFER_SIZE positions in recording buffer
        if (state.recordingBuffer.length > RECORDING_BUFFER_SIZE) {
          state.recordingBuffer = state.recordingBuffer.slice(-RECORDING_BUFFER_SIZE)
        }
      }
    },
    clearPositions: (state) => {
      state.positions = []
      state.currentPosition = null
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload
      if (!action.payload) {
        // Clear recording buffer when stopping recording
        state.recordingBuffer = []
      }
    },
    clearRecordingBuffer: (state) => {
      state.recordingBuffer = []
    },
    toggleWebcamDebug: (state) => {
      state.showWebcamDebug = !state.showWebcamDebug
    },
    setWebcamDebug: (state, action: PayloadAction<boolean>) => {
      state.showWebcamDebug = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startTracking.fulfilled, (state) => {
        state.isTracking = true
      })
      .addCase(stopTracking.fulfilled, (state) => {
        state.isTracking = false
      })
  },
})

export const { 
  addPosition, 
  clearPositions, 
  setTracking, 
  setRecording, 
  clearRecordingBuffer, 
  toggleWebcamDebug,
  setWebcamDebug
} = eyeTrackingSlice.actions
export default eyeTrackingSlice.reducer 