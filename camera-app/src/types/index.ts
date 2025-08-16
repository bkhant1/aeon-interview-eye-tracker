export interface EyePosition {
  x: number;
  y: number;
  timestamp: number;
  confidence?: number;
}

export interface VideoStreamState {
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
}

export interface EyeTrackingState {
  positions: EyePosition[];
  isTracking: boolean;
  currentPosition: EyePosition | null;
  recordingBuffer: EyePosition[];
  isRecording: boolean;
  showWebcamDebug: boolean;
}

export interface AppState {
  currentStep: 'permission' | 'calibration' | 'tracking' | 'playback';
  calibrationPoints: { x: number; y: number }[];
  sessionId: string;
}

export interface RootState {
  videoStream: VideoStreamState;
  eyeTracking: EyeTrackingState;
  app: AppState;
}

 