const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:3000' }));

const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected');

    const videoPath = path.resolve(__dirname, './yoo.mp4');
    const readStream = fs.createReadStream(videoPath, { highWaterMark: 64 * 1024 });

    const sessionId = crypto.randomUUID();
    socket.emit('video-start', { sessionId });

    readStream.on('data', (chunk) => {
        socket.emit('video-chunk', { sessionId, chunk });
    });

    readStream.on('error', (error) => {
        console.error('Error reading video file:', error);
        socket.disconnect();
    });

    readStream.on('end', () => {
        socket.emit('video-end', { sessionId });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        readStream.destroy();
    });
});

server.listen(5000, () => {
    console.log('Server is listening on port 5000');
});
