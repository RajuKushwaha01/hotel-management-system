import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    socketRef.current = io('http://localhost:5000', { withCredentials: true });

    socketRef.current.on('connect', () => {
      setConnected(true);
      // Chefs join the "kitchen" room to receive new KOTs
      if (user.role === 'chef') socketRef.current.emit('join-room', 'kitchen');
      if (user.role === 'maintenance') socketRef.current.emit('join-room', 'maintenance');
      if (user.role !== 'customer') socketRef.current.emit('join-room', 'rooms-board');
      socketRef.current.emit('join-user', user._id);
    });

    socketRef.current.on('disconnect', () => setConnected(false));

    return () => socketRef.current?.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
