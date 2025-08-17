import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { EyePosition, CalibrationPosition } from '../types'
import { API_ENDPOINTS } from '../config/api'

const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const sendCalibrationData = createAsyncThunk(
  'app/sendCalibrationData',
  async (_, { getState }) => {
    const state = getState() as any
    const { sessionId, calibrationPoints } = state.app
    
    try {
      const response = await fetch(API_ENDPOINTS.calibration, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          calibration_points: calibrationPoints,
          timestamp: Date.now(),
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Calibration API call failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Calibration data sent successfully:', result.message)
      return result
    } catch (error) {
      console.error('Failed to send calibration data:', error)
      throw error
    }
  }
)

export const sendRecordingData = createAsyncThunk(
  'app/sendRecordingData',
  async (recordingBuffer: EyePosition[], { getState }) => {
    const state = getState() as any
    const { sessionId, recordingNumber } = state.app
    
    try {
      const response = await fetch(API_ENDPOINTS.eyeTracking, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          recording_number: recordingNumber,
          positions: recordingBuffer,
          timestamp: Date.now(),
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Recording API call failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Recording data sent successfully:', result.message)
      return result
    } catch (error) {
      console.error('Failed to send recording data:', error)
      throw error
    }
  }
)

const appSlice = createSlice({
  name: 'app',
  initialState: {
    currentStep: 'permission' as 'permission' | 'calibration' | 'tracking' | 'playback',
    calibrationPoints: [] as CalibrationPosition[],
    sessionId: generateSessionId(),
    recordingNumber: 1,
  },
  reducers: {
    setCurrentStep: (state, action: PayloadAction<'permission' | 'calibration' | 'tracking' | 'playback'>) => {
      state.currentStep = action.payload
    },
    addCalibrationPoint: (state, action: PayloadAction<CalibrationPosition>) => {
      state.calibrationPoints.push(action.payload)
    },
    clearCalibrationPoints: (state) => {
      state.calibrationPoints = []
    },
    resetApp: (state) => {
      state.currentStep = 'permission'
      state.calibrationPoints = []
      state.sessionId = generateSessionId()
      state.recordingNumber = 1
    },
    generateNewSessionId: (state) => {
      state.sessionId = generateSessionId()
    },
    incrementRecordingNumber: (state) => {
      state.recordingNumber += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendCalibrationData.pending, (_state) => {
        // Optional: Add loading state if needed
      })
      .addCase(sendCalibrationData.fulfilled, (_state) => {
        // Calibration data sent successfully
      })
      .addCase(sendCalibrationData.rejected, (_state, action) => {
        // Handle error if needed
        console.error('Failed to send calibration data:', action.error)
      })
      .addCase(sendRecordingData.pending, (_state) => {
        // Optional: Add loading state if needed
      })
      .addCase(sendRecordingData.fulfilled, (_state) => {
        // Recording data sent successfully
      })
      .addCase(sendRecordingData.rejected, (_state, action) => {
        // Handle error if needed
        console.error('Failed to send recording data:', action.error)
      })
  },
})

export const { 
  setCurrentStep, 
  addCalibrationPoint, 
  clearCalibrationPoints, 
  resetApp,
  generateNewSessionId,
  incrementRecordingNumber
} = appSlice.actions

export default appSlice.reducer 