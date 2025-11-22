import { Server } from 'socket.io';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { User } from '../models/index.js';

let io;

// Create Clerk client
const getClerkClient = () => createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER
});

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify Clerk JWT token (from getToken())
      try {
        const clerkClient = getClerkClient();
        
        // Verify the JWT token
        const decoded = await clerkClient.verifyToken(token);
        
        if (!decoded || !decoded.sub) {
          return next(new Error('Authentication error: Invalid token'));
        }

        const clerkUserId = decoded.sub;

        // Get user from database
        const user = await User.findOne({ clerkId: clerkUserId });
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // Attach user info to socket
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.userEmail = user.email;
        socket.clerkId = clerkUserId;
        
        next();
      } catch (clerkError) {
        console.error('Clerk token verification failed:', clerkError);
        return next(new Error('Authentication error: Invalid token'));
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: User ${socket.userId} (${socket.userRole})`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific rooms
    if (socket.userRole === 'admin') {
      socket.join('admin');
      console.log(`👑 Admin joined: ${socket.userId}`);
    } else if (socket.userRole === 'vendor') {
      socket.join(`vendor:${socket.userId}`);
      console.log(`🏪 Vendor joined: ${socket.userId}`);
    }

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: User ${socket.userId} - Reason: ${reason}`);
    });

    // Handle notification read
    socket.on('mark_notification_read', async (notificationId) => {
      try {
        console.log(`📖 Marking notification as read: ${notificationId} for user ${socket.userId}`);
        // This will be handled by the notification service
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

