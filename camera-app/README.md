# Eye Tracking App

A modern React + TypeScript web application that performs eye tracking with calibration and real-time position visualization.

## Features

- **Three-Step Process**: Permission → Calibration → Tracking
- **Camera Integration**: Hidden camera feed for eye tracking
- **Calibration System**: Multi-point calibration for accurate tracking
- **Real-time Visualization**: Live graph showing eye movement patterns
- **Mock Eye Tracking**: Simulated eye tracking data (ready for real implementation)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient background with glassmorphism effects
- **TypeScript**: Full type safety and better development experience

## Technology Stack

- **React 19.1.1** - Latest version of React
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Canvas API** - Real-time graph rendering
- **MediaDevices API** - Camera access
- **CSS3** - Modern styling with gradients and animations

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A device with a camera

### Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd camera-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## How It Works

### Step 1: Camera Permission
- The app requests camera access for eye tracking
- Camera feed runs in the background (not visible to user)
- User must grant permission to proceed

### Step 2: Calibration
- User looks at calibration points on screen
- App captures "eye positions" at each point
- Progress bar shows calibration completion
- Currently uses mock data (sinusoidal movement)

### Step 3: Eye Tracking
- Real-time eye tracking begins
- Live graph displays eye movement patterns
- Statistics show current X/Y positions and tracking count
- Camera continues running in background

## Mock Eye Tracking Implementation

The current implementation uses a mock function that generates sinusoidal eye movement data:

```typescript
const mockEyeTracking = (videoStream: MediaStream): EyePosition => {
  const now = Date.now();
  const time = now / 1000;
  return {
    x: Math.sin(time) * 100 + 200,
    y: Math.cos(time * 0.5) * 50 + 150,
    timestamp: now
  };
};
```

This function can be easily replaced with real eye tracking algorithms (e.g., using face-api.js, OpenCV.js, or other computer vision libraries).

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
camera-app/
├── src/
│   ├── App.tsx          # Main eye tracking application
│   ├── App.css          # Application styles
│   ├── index.css        # Global styles
│   ├── main.tsx         # Application entry point
│   └── vite-env.d.ts    # Vite type definitions
├── public/              # Static assets
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Features in Detail

### Calibration System
- **5-Point Calibration**: Captures eye positions at different screen locations
- **Visual Feedback**: Animated calibration targets with progress tracking
- **Data Collection**: Stores calibration points for future reference

### Real-time Tracking
- **Live Graph**: Canvas-based visualization of eye movement
- **Performance Optimized**: Keeps last 100 positions for smooth rendering
- **Statistics Display**: Real-time X/Y coordinates and tracking metrics

### User Interface
- **Step Indicators**: Clear progress through the three-step process
- **Responsive Design**: Adapts to different screen sizes
- **Modern Styling**: Glassmorphism effects and smooth animations

## Browser Compatibility

This application uses modern web APIs and is compatible with:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Notes

- Camera access requires HTTPS in production environments
- The application only requests video permissions (no audio)
- Camera streams are not recorded or transmitted to external servers
- All processing happens locally in the browser

## Future Enhancements

### Real Eye Tracking Implementation
1. **Face Detection**: Use face-api.js or similar for face detection
2. **Eye Region Extraction**: Identify and crop eye regions from video frames
3. **Pupil Detection**: Implement algorithms to detect pupil centers
4. **Gaze Mapping**: Map pupil positions to screen coordinates

### Additional Features
- **Heat Maps**: Visualize areas of focus
- **Fixation Detection**: Identify when eyes are stationary
- **Saccade Detection**: Detect rapid eye movements
- **Data Export**: Save tracking data for analysis
- **Multiple Calibration Methods**: 9-point, 13-point calibration options

## Development

The application is built with Vite for fast development and hot module replacement. Any changes to the source code will automatically reload in the browser.

## License

This project is open source and available under the MIT License.
