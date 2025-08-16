import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: [
      '@mediapipe/face_mesh',
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow-models/face-landmarks-detection'
    ]
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'mediapipe-worker': ['@mediapipe/face_mesh', '@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl', '@tensorflow-models/face-landmarks-detection']
        }
      }
    }
  }
})
