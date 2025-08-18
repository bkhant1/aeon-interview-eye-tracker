# Aeon lab demo task: eye-motion recorder

This is a small demo app that allows recording eye motions and explore the recordings later. It supports recording and playback.

> **_NOTE:_**  Eye motion is measured as the position of the center of the iris relative the left corner of the eye.  *Normalized* eye motion means the position of the iris in the range [-1;1], where -1 is the left-most the center of the iris can go, and 1 the right-most. The gaze of the user might go out of the screen.

## Features

### Recording tab

The recording tab is a 3 step loop. Every time the loop is restarted, a new recording session is created

#### 1. Camera setup

The user is prompted to give access to the camera. We request a fixed FPS of 30. If the device does not support it the application will display an error. 

#### 2. Calibration

The tracker is calibrated for the user's maximum eye motion. It is not calibrated relative to the screen, but instead to how far left/right the user's iris can move. The user is prompted to look as far left, center and right as they can, pressing `<SPACEBAR>` at each step.

#### 3. Recording

This screen allows to take multiple recordings of the user's eye motion. When clicking the recording button, you will get live feedback on the normalized eye position of the user's left eye over time. When the recording is stopped is gets saved. It's possible to then start a new recording or quit.

![recordingScreen](./recordingScreen.png)

### Playback tab

The playback tab let's you explore past recordings. It is only currently possible to visualize the normalized position of the left eye.  

Once you have chosen a recording to explore, it is possible to zoom in or out using the sliders at the bottom of the screen, and to visulasize a moving-averaged denoised signal by ticking the box.

Some statistics are available for the selected data range above the graph.

![playbackScreen](./playbackScreen.png)

## How is it built?

### Frontend

The frontend is located in `./camera-app`. It's a react/redux app. 

The iris and eye corners detection happens in the frontend, using [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker). 
