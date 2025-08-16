import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { VideoStreamState } from '../types'

const initialState: VideoStreamState = {
  isActive: false,
  stream: null,
  error: null,
}

export const startVideoStream = createAsyncThunk(
  'videoStream/start',
  async (_, { rejectWithValue }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { min: 30, ideal: 30, max: 30 }
        },
        audio: false
      })
      
      return stream
    } catch (error) {
      return rejectWithValue('Failed to access camera. Please make sure you have granted camera permissions.')
    }
  }
)

export const stopVideoStream = createAsyncThunk(
  'videoStream/stop',
  async (_, { getState }) => {
    const state = getState() as any
    const stream = state.videoStream.stream
    
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
    }
    
    return null
  }
)

const videoStreamSlice = createSlice({
  name: 'videoStream',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startVideoStream.pending, (state) => {
        state.isActive = false
        state.error = null
      })
      .addCase(startVideoStream.fulfilled, (state, action) => {
        state.isActive = true
        state.stream = action.payload
        state.error = null
      })
      .addCase(startVideoStream.rejected, (state, action) => {
        state.isActive = false
        state.error = action.payload as string
      })
      .addCase(stopVideoStream.fulfilled, (state) => {
        state.isActive = false
        state.stream = null
        state.error = null
      })
  },
})

export const { setError, clearError } = videoStreamSlice.actions
export default videoStreamSlice.reducer 