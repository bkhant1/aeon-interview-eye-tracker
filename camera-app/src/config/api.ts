// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export const API_ENDPOINTS = {
  calibration: `${API_BASE_URL}/api/calibration`,
  eyeTracking: `${API_BASE_URL}/api/eye-tracking`,
  recordings: (sessionId: string) => `${API_BASE_URL}/api/recordings/${sessionId}`,
  sessionData: (sessionId: string) => `${API_BASE_URL}/api/eye-tracking/${sessionId}`,
  calibrationData: (sessionId: string) => `${API_BASE_URL}/api/calibration/${sessionId}`,
  deleteSession: (sessionId: string) => `${API_BASE_URL}/api/sessions/${sessionId}`,
  allSessions: `${API_BASE_URL}/api/sessions`,
  recordingData: (sessionId: string, recordingNumber: number, eye?: string, noiseReduction?: boolean) => {
    const params = new URLSearchParams()
    if (eye && eye !== 'both') params.append('eye', eye)
    if (noiseReduction) params.append('noise_reduction', 'true')
    const queryString = params.toString()
    return `${API_BASE_URL}/api/sessions/${sessionId}/recordings/${recordingNumber}${queryString ? `?${queryString}` : ''}`
  },
} 