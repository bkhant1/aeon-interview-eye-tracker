import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { VideoStreamState } from '../types'
import { startTracking, stopTracking } from './eyeTrackingSlice'

const initialState: VideoStreamState = {
  isActive: false,
  stream: null,
  error: null,
}

export const startVideoStream = createAsyncThunk(
  'videoStream/start',
  async (_, { rejectWithValue, dispatch }) => {
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
      
      // Create a video element for eye tracking
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
      videoElement.style.display = 'none';
      document.body.appendChild(videoElement);
      
      // Wait for video to be ready and ensure it's playing
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve).catch(resolve);
        };
      });
      
      // Start eye tracking immediately
      await dispatch(startTracking(videoElement)).unwrap();
      
      return stream
    } catch (error) {
      return rejectWithValue('Failed to access camera. Please make sure you have granted camera permissions.')
    }
  }
)

export const stopVideoStream = createAsyncThunk(
  'videoStream/stop',
  async (_, { getState, dispatch }) => {
    const state = getState() as any
    const stream = state.videoStream.stream
    
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
    }
    
    // Stop eye tracking
    await dispatch(stopTracking()).unwrap();
    
    // Remove the hidden video element
    const videoElement = document.querySelector('video[style*="display: none"]');
    if (videoElement) {
      document.body.removeChild(videoElement);
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