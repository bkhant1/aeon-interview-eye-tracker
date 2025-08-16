import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

const appSlice = createSlice({
  name: 'app',
  initialState: {
    currentStep: 'permission' as 'permission' | 'calibration' | 'tracking' | 'playback',
    calibrationPoints: [] as { x: number; y: number }[],
  },
  reducers: {
    setCurrentStep: (state, action: PayloadAction<'permission' | 'calibration' | 'tracking' | 'playback'>) => {
      state.currentStep = action.payload
    },
    addCalibrationPoint: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.calibrationPoints.push(action.payload)
    },
    clearCalibrationPoints: (state) => {
      state.calibrationPoints = []
    },
    resetApp: (state) => {
      state.currentStep = 'permission'
      state.calibrationPoints = []
    },
  },
})

export const { 
  setCurrentStep, 
  addCalibrationPoint, 
  clearCalibrationPoints, 
  resetApp 
} = appSlice.actions

export default appSlice.reducer 