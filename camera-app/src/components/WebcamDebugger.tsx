import { useRef, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { toggleWebcamDebug } from '../store/eyeTrackingSlice'

interface WebcamDebuggerProps {
  stream: MediaStream | null
}

export default function WebcamDebugger({ stream }: WebcamDebuggerProps) {
  const dispatch = useAppDispatch()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { showWebcamDebug } = useAppSelector(state => state.eyeTracking)

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const handleToggle = () => {
    dispatch(toggleWebcamDebug())
  }

  if (!showWebcamDebug) {
    return (
      <button 
        onClick={handleToggle}
        className="webcam-debug-toggle"
        title="Show webcam debug"
      >
        📹
      </button>
    )
  }

  return (
    <div className="webcam-debugger">
      <div className="webcam-debug-header">
        <span>Webcam Debug</span>
        <button 
          onClick={handleToggle}
          className="webcam-debug-close"
          title="Hide webcam debug"
        >
          ×
        </button>
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="webcam-debug-video"
      />
    </div>
  )
} 