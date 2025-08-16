import { configureStore } from '@reduxjs/toolkit'
import videoStreamReducer from './videoStreamSlice'
import eyeTrackingReducer from './eyeTrackingSlice'
import appReducer from './appSlice'

export const store = configureStore({
  reducer: {
    videoStream: videoStreamReducer,
    eyeTracking: eyeTrackingReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore MediaStream objects in state
        ignoredActions: ['videoStream/start/fulfilled'],
        ignoredPaths: ['videoStream.stream'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 