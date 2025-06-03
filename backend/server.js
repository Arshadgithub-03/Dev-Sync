import 'dotenv/config';
import http from 'http';
import app from './app.js';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Handle large payload errors
server.on('clientError', (err, socket) => {
  if (err.code === 'HPE_HEADER_OVERFLOW') {
    socket.end('HTTP/1.1 431 Request Header Fields Too Large\r\n\r\n');
  } else {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

// Initialize Socket.IO server
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

// Authenticate socket connections
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) return next(new Error('Invalid projectId'));

        socket.project = await projectModel.findById(projectId);
        if (!token) return next(new Error('Authentication error'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return next(new Error('Invalid token'));

        socket.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
});

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString();
    console.log('User Connected');

    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        const message = data.message;

        socket.broadcast.to(socket.roomId).emit('project-message', data);

        if (message.includes('@ai')) {
            const result = await generateResult(message.replace('@ai', ''));
            io.to(socket.roomId).emit('project-message', {
                message: result,
                sender: { _id: 'ai', name: 'AI' },
                createdAt: new Date().toISOString(), // Add timestamp for AI message
            });
        }
    });

    // Collaborative cursor update relay
    socket.on('CURSOR_UPDATE', data => {
        socket.broadcast.to(socket.roomId).emit('CURSOR_UPDATE', data);
    });

    // Collaborative code change relay (if not present)
    socket.on('CODE_CHANGE', data => {
        socket.broadcast.to(socket.roomId).emit('CODE_CHANGE', data);
    });

    // Typing status relay (if not present)
    socket.on('TYPING_STATUS', data => {
        socket.broadcast.to(socket.roomId).emit('TYPING_STATUS', data);
    });

    // Relay USER_ONLINE event to all clients in the same room
    socket.on('USER_ONLINE', data => {
        socket.broadcast.to(socket.roomId).emit('USER_ONLINE', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
        socket.leave(socket.roomId);
    });
});

server.listen(port, () => console.log(`Server running on port ${port}`));