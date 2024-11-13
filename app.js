const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const { Worker } = require('worker_threads');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins in Express
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Allow only the client origin

// Enable CORS for Socket.IO
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000', // Explicitly allow the client origin
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('Client connected');
    const sessionId = crypto.randomUUID();

    // Create a worker for each client to handle video streaming
    const worker = new Worker(path.resolve(__dirname, './videoWorker.js'), {
        workerData: { sessionId }
    });

    // Handle video chunks from worker
    worker.on('message', ({ type, chunk, sessionId }) => {
        if (type === 'video-chunk') {
            socket.emit('video-chunk', { sessionId, chunk });
        } else if (type === 'video-end') {
            socket.emit('video-end', { sessionId });
        }
    });

    // Handle errors in the worker
    worker.on('error', (error) => {
        console.error('Worker error:', error);
        socket.disconnect();
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        worker.terminate();
    });
});

server.listen(5000, () => {
    console.log('Server is listening on port 5000');
});
