import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';

export const useSocket = () => {
  const { user, getToken } = useUser();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const connectSocket = async () => {
      try {
        const token = await getToken();
        
        if (!token) {
          console.warn('No token available for socket connection');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const newSocket = io(apiUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
          console.log('✅ Socket connected');
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ Socket disconnected:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch (error) {
        console.error('Error connecting socket:', error);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user, getToken]);

  return { socket, isConnected };
};



