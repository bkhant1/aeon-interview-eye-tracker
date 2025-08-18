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

export interface Recording {
  recording_number: number;
  data_points: number;
  duration: number;
  timestamp: number;
  session_id: string;
}

export interface Session {
  session_id: string;
  summary: {
    session_id: string;
    total_recordings: number;
    has_calibration: boolean;
    total_data_points: number;
    recording_numbers: number[];
  };
  recordings: Recording[];
}

export interface RootState {
  videoStream: VideoStreamState;
  eyeTracking: EyeTrackingState;
  app: AppState;
}

 