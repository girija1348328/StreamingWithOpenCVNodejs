const fs = require('fs');
const path = require('path');
const { parentPort, workerData } = require('worker_threads');

// Get session ID passed from the main thread
const { sessionId } = workerData;

// Define the video path
const videoPath = path.resolve(__dirname, './yoo.mp4');

// Create a readable stream to read the video file in chunks
const readStream = fs.createReadStream(videoPath, { highWaterMark: 64 * 1024 });

// Notify the main thread when streaming starts
parentPort.postMessage({ type: 'video-start', sessionId });

readStream.on('data', (chunk) => {
    // Send each chunk of the video to the main thread
    parentPort.postMessage({ type: 'video-chunk', sessionId, chunk });
});

readStream.on('end', () => {
    // Notify the main thread when the video ends
    parentPort.postMessage({ type: 'video-end', sessionId });
});

// Handle errors
readStream.on('error', (error) => {
    parentPort.postMessage({ type: 'error', error: error.message });
});
