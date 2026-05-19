const { Server } = require('socket.io');

const rooms = {}; // Track active rooms

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  // Make io accessible from controllers
  const app = require('./server');
  return io;

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);
     // Transfer real-time events
    socket.on('join-transfer-room', ({ transferId }) => {
      socket.join('transfer-' + transferId);
    });

    socket.on('leave-transfer-room', ({ transferId }) => {
      socket.leave('transfer-' + transferId);
    });
    // Hospital joins SOS monitoring room
    socket.on('join-hospital-monitor', ({ hospitalId }) => {
      socket.join('hospital-monitor');
      console.log('Hospital monitoring SOS alerts:', hospitalId);
    });

    // Join a call room
    socket.on('join-room', ({ roomId, userId, userName, role }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      socket.data.userName = userName;
      socket.data.role = role;

      if (!rooms[roomId]) rooms[roomId] = [];
      rooms[roomId].push({ socketId: socket.id, userId, userName, role });

      console.log(userName + ' joined room: ' + roomId);

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        userId,
        userName,
        role,
      });

      // Send existing users to new joiner
      const existingUsers = rooms[roomId].filter(u => u.socketId !== socket.id);
      socket.emit('existing-users', existingUsers);
    });

    // WebRTC Signaling
    socket.on('offer', ({ to, offer }) => {
      socket.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      socket.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    // Chat message during call
    socket.on('call-message', ({ roomId, message, userName }) => {
      io.to(roomId).emit('call-message', {
        message,
        userName,
        time: new Date().toLocaleTimeString(),
      });
    });

    // End call
    socket.on('end-call', ({ roomId }) => {
      socket.to(roomId).emit('call-ended');
      socket.leave(roomId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId && rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(u => u.socketId !== socket.id);
        if (rooms[roomId].length === 0) delete rooms[roomId];
        socket.to(roomId).emit('user-left', { socketId: socket.id });
      }
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });

 return io;
};

module.exports = initSocket;