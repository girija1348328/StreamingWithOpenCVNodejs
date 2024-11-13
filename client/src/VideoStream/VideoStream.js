import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const VideoStream = () => {
    const videoRef = useRef(null);
    const [socket, setSocket] = useState(null);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    useEffect(() => {
        // Initialize socket connection without specifying transports
        const socketConnection = io('http://localhost:5000'); 
        setSocket(socketConnection);

        const mediaSource = new MediaSource();
        const video = videoRef.current;

        video.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener('sourceopen', () => {
            const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

            socketConnection.on('video-start', ({ sessionId }) => {
                console.log('Video start with session ID:', sessionId);
                setCurrentSessionId(sessionId); // Store the session ID
            });

            socketConnection.on('video-chunk', ({ sessionId, chunk }) => {
                // Ensure the chunk belongs to the current session
                if (sessionId === currentSessionId) {
                    const buffer = new Uint8Array(chunk);
                    if (sourceBuffer && !sourceBuffer.updating) {
                        sourceBuffer.appendBuffer(buffer);
                    }
                }
            });

            socketConnection.on('video-end', ({ sessionId }) => {
                // Check that the video end is for the current session
                if (sessionId === currentSessionId) {
                    console.log('Video end with session ID:', sessionId);
                    if (!sourceBuffer.updating) {
                        mediaSource.endOfStream();
                    } else {
                        sourceBuffer.addEventListener('updateend', () => mediaSource.endOfStream(), { once: true });
                    }
                }
            });
        });

        return () => {
            socketConnection.disconnect();
        };
    }, [currentSessionId]);

    return <video ref={videoRef} controls autoPlay />;
};

export default VideoStream;
