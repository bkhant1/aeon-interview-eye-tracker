import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { EyePosition } from '../types'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// Constants
const POSITION_BUFFER_SIZE = 30;
const RECORDING_BUFFER_SIZE = 1000;

// MediaPipe face landmarker instance
let faceLandmarker: FaceLandmarker | null = null;
let lastVideoTime = -1;
let animationFrameId: number | null = null;

// Initialize MediaPipe face landmarker
const initializeFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (!faceLandmarker) {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
    } catch (error) {
      console.error('Failed to initialize MediaPipe FaceLandmarker:', error);
      // Reset the faceLandmarker so we can try again
      faceLandmarker = null;
      throw error;
    }
  }
  return faceLandmarker;
};

// Process face landmarker results to extract iris positions
const processResults = (results: any) => {
  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    const landmarks = results.faceLandmarks[0];
    
    // Iris landmarks (MediaPipe face landmarker)
    // Left iris center: landmark 468
    // Right iris center: landmark 473
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];
    
    if (leftIris && rightIris) {
      // Calculate average position of both irises
      const avgX = (leftIris.x + rightIris.x) / 2;
      const avgY = (leftIris.y + rightIris.y) / 2;
      
      const eyePosition: EyePosition = {
        x: avgX,
        y: avgY,
        timestamp: Date.now(),
        confidence: (leftIris.z + rightIris.z) / 2 // Use z-coordinate as confidence
      };
      
      // Dispatch custom event instead of using global dispatch
      window.dispatchEvent(new CustomEvent('eyePosition', { 
        detail: eyePosition 
      }));
    }
  }
};

// Render loop for continuous detection
const renderLoop = (video: HTMLVideoElement) => {
  if (video.currentTime !== lastVideoTime) {
    const results = faceLandmarker?.detectForVideo(video, Date.now());
    if (results) {
      processResults(results);
    }
    lastVideoTime = video.currentTime;
  }

  animationFrameId = requestAnimationFrame(() => {
    renderLoop(video);
  });
};

export const startTracking = createAsyncThunk(
  'eyeTracking/start',
  async (videoElement: HTMLVideoElement, { dispatch }) => {
    try {
      // Set up event listener instead of global dispatch
      const handleEyePosition = (event: CustomEvent) => {
        dispatch(addPosition(event.detail));
      };
      
      window.addEventListener('eyePosition', handleEyePosition as EventListener);
      
      // Initialize MediaPipe face mesh
      await initializeFaceLandmarker();
      
      // Start the render loop
      renderLoop(videoElement);
      
      return true;
    } catch (error) {
      console.error('Failed to start tracking:', error);
      throw error;
    }
  }
)

export const stopTracking = createAsyncThunk(
  'eyeTracking/stop',
  async () => {
    try {
      // Stop the render loop
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      // Reset video time
      lastVideoTime = -1;
      
      return false;
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      throw error;
    }
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