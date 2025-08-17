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

export interface NormalizedPosition {
  timestamp: number;
  x: number;
}

export interface CalibrationPosition extends EyePosition {
  gaze_direction: 'left' | 'center' | 'right';
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
  calibrationPoints: CalibrationPosition[];
  sessionId: string;
  recordingNumber: number;
}

export interface RootState {
  videoStream: VideoStreamState;
  eyeTracking: EyeTrackingState;
  app: AppState;
}

 