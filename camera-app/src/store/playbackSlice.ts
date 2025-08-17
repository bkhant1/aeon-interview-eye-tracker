import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { API_ENDPOINTS } from '../config/api'
import type { EyePosition, NormalizedPosition } from '../types'

interface Recording {
  recording_number: number
  data_points: number
  duration: number
  timestamp: number
  session_id: string
}

interface Session {
  session_id: string
  summary: {
    session_id: string
    total_recordings: number
    has_calibration: boolean
    total_data_points: number
    recording_numbers: number[]
  }
  recordings: Recording[]
}

interface PlaybackState {
  sessions: Session[]
  selectedSession: Session | null
  selectedRecording: Recording | null
  recordingData: NormalizedPosition[]
  isLoading: boolean
  error: string | null
  eyeFilter: string
  noiseReduction: boolean
}

const initialState: PlaybackState = {
  sessions: [],
  selectedSession: null,
  selectedRecording: null,
  recordingData: [],
  isLoading: false,
  error: null,
  eyeFilter: 'both',
  noiseReduction: false,
}

// Async thunk to fetch all sessions
export const fetchAllSessions = createAsyncThunk(
  'playback/fetchAllSessions',
  async () => {
    try {
      const response = await fetch(API_ENDPOINTS.allSessions)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`)
      }
      
      const result = await response.json()
      return result.sessions
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      throw error
    }
  }
)

// Async thunk to fetch recording data
export const fetchRecordingData = createAsyncThunk(
  'playback/fetchRecordingData',
  async ({ 
    sessionId, 
    recordingNumber, 
    eye = 'both', 
    noiseReduction = false 
  }: { 
    sessionId: string; 
    recordingNumber: number; 
    eye?: string; 
    noiseReduction?: boolean; 
  }) => {
    try {
      const response = await fetch(API_ENDPOINTS.recordingData(sessionId, recordingNumber, eye, noiseReduction))
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recording data: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Failed to fetch recording data:', error)
      throw error
    }
  }
)

const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    setSelectedSession: (state, action: PayloadAction<Session | null>) => {
      state.selectedSession = action.payload
      state.selectedRecording = null
      state.recordingData = []
    },
    setSelectedRecording: (state, action: PayloadAction<Recording | null>) => {
      state.selectedRecording = action.payload
      state.recordingData = []
    },
    clearPlaybackData: (state) => {
      state.selectedSession = null
      state.selectedRecording = null
      state.recordingData = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all sessions
      .addCase(fetchAllSessions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAllSessions.fulfilled, (state, action) => {
        state.isLoading = false
        state.sessions = action.payload
        state.error = null
      })
      .addCase(fetchAllSessions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch sessions'
      })
      // Fetch recording data
      .addCase(fetchRecordingData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRecordingData.fulfilled, (state, action) => {
        state.isLoading = false
        state.recordingData = action.payload
        state.error = null
      })
      .addCase(fetchRecordingData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch recording data'
      })
  },
})

export const { 
  setSelectedSession, 
  setSelectedRecording, 
  clearPlaybackData 
} = playbackSlice.actions

export default playbackSlice.reducer 