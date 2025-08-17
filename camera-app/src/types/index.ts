export interface EyeLandmark {
  x: number;
  y: number;
  z: number;
}

export interface EyeData {
  corners: EyeLandmark[];
  center: EyeLandmark;
}

export interface EyePosition {
  timestamp: number;
  confidence?: number;
  leftEye?: EyeData;
  rightEye?: EyeData;
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
  calibrationPoints: EyePosition[];
  sessionId: string;
}

export interface RootState {
  videoStream: VideoStreamState;
  eyeTracking: EyeTrackingState;
  app: AppState;
}

 