# Aeon lab demo task: eye-motion recorder

This is a small demo app that allows recording eye motions and explore the recordings later. It supports recording and playback.

## How is eye motion measured?



## Recording tab

The recording tab is a 3 step loop. Every time the loop is restarted, a new recording session is created

### 1. Camera setup

The user is prompted to give access to the camera. We request a fixed FPS of 30. If the device does not support it the application will display an error. 

### 2. Calibration

The tracker is calibrated for the user's maximum eye motion. It is not calibrated relative to the screen, but instead to how far left/right the user's iris can move. The user is prompted to look as far left, center and right as they can, pressing `<SPACEBAR>` at each step.

### 3. Recording

This screen allows to take multiple recordings of the user's eye motion. When clicking the recording button, you will get live feedback on the normalized eye position of the user's left eye over time. When the recording is stopped is gets saved. It's possible to then start a new recording.

## Playback tab

The playback tab let's you explore past recordings. It is only possible to visualize the normalized position of the left eye. You can toggle noise reduction on/off to get cleaner data visualization. 




