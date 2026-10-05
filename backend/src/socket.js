let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  const { setIO } = require('./services/notify');

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  setIO(io);

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Dynamic channel joining (handles 'rooms-board', 'kitchen', 'maintenance', etc.)
    socket.on('join-room', (room) => {
      socket.join(room);
    });

    // Every logged-in user joins their own personal room so notifications reach only them
    socket.on('join-user', (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };