// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export const API_ENDPOINTS = {
  calibration: `${API_BASE_URL}/api/calibration`,
  eyeTracking: `${API_BASE_URL}/api/eye-tracking`,
  recordings: (sessionId: string) => `${API_BASE_URL}/api/recordings/${sessionId}`,
  sessionData: (sessionId: string) => `${API_BASE_URL}/api/eye-tracking/${sessionId}`,
  calibrationData: (sessionId: string) => `${API_BASE_URL}/api/calibration/${sessionId}`,
  deleteSession: (sessionId: string) => `${API_BASE_URL}/api/sessions/${sessionId}`,
} 