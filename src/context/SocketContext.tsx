import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = (): Socket | null => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Determine backend URL
    const SOCKET_URL = (import.meta.env?.VITE_BACKEND_URL as string) || 'http://localhost:5000';
    
    const newSocket: Socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  if (!socket) {
    return <div>Loading connection...</div>; // Minimal loader while connection spins up
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
