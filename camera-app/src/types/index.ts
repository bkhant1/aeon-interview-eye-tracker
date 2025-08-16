export interface EyePosition {
  x: number;
  y: number;
  timestamp: number;
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
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  messagesSent: number;
}

export interface AppState {
  currentStep: 'permission' | 'calibration' | 'tracking' | 'playback';
  calibrationPoints: { x: number; y: number }[];
}

export interface RootState {
  videoStream: VideoStreamState;
  eyeTracking: EyeTrackingState;
  webSocket: WebSocketState;
  app: AppState;
}

export interface WebSocketMessage {
  type: 'eye_position' | 'calibration' | 'tracking_start' | 'tracking_stop';
  data: any;
  timestamp: number;
} 