import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://drinkingames-backend.onrender.com');

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(() => !!sessionStorage.getItem('drinkgames_session'));
  const [reconnectGameState, setReconnectGameState] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);

      // Attempt reconnection if session data exists
      const sessionData = sessionStorage.getItem('drinkgames_session');
      if (sessionData) {
        try {
          const { playerId, lobbyCode } = JSON.parse(sessionData);
          newSocket.emit('player:reconnect', { playerId, lobbyCode }, (response) => {
            if (response.success) {
              console.log('Reconnected to lobby:', lobbyCode);
              setPlayer(response.player);
              setLobby(response.lobby);
              if (response.gameState) {
                setReconnectGameState(response.gameState);
              }
            } else {
              console.log('Reconnect failed, clearing session:', response.error);
              sessionStorage.removeItem('drinkgames_session');
            }
            setIsReconnecting(false);
          });
        } catch (e) {
          sessionStorage.removeItem('drinkgames_session');
          setIsReconnecting(false);
        }
      } else {
        setIsReconnecting(false);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server');
      setIsConnected(false);
    });

    // Lobby events
    newSocket.on('lobby:player-joined', (data) => {
      setLobby(data.lobby);
    });

    newSocket.on('lobby:player-left', (data) => {
      setLobby(data.lobby);
    });

    newSocket.on('lobby:host-changed', (data) => {
      setLobby(data.lobby);
    });

    newSocket.on('lobby:player-disconnected', (data) => {
      setLobby(data.lobby);
    });

    newSocket.on('lobby:player-reconnected', (data) => {
      setLobby(data.lobby);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createLobby = useCallback((username) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('lobby:create', { username }, (response) => {
        if (response.error) {
          setError(response.error);
          reject(new Error(response.error));
        } else {
          setPlayer(response.player);
          setLobby(response.lobby);
          setError(null);
          sessionStorage.setItem('drinkgames_session', JSON.stringify({
            playerId: response.player.id,
            username: response.player.username,
            lobbyCode: response.lobby.code
          }));
          resolve(response);
        }
      });
    });
  }, [socket]);

  const joinLobby = useCallback((username, lobbyCode) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('lobby:join', { username, lobbyCode }, (response) => {
        if (response.error) {
          setError(response.error);
          reject(new Error(response.error));
        } else {
          setPlayer(response.player);
          setLobby(response.lobby);
          setError(null);
          sessionStorage.setItem('drinkgames_session', JSON.stringify({
            playerId: response.player.id,
            username: response.player.username,
            lobbyCode: response.lobby.code
          }));
          resolve(response);
        }
      });
    });
  }, [socket]);

  const leaveLobby = useCallback(() => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve();
        return;
      }

      socket.emit('lobby:leave', () => {
        setPlayer(null);
        setLobby(null);
        sessionStorage.removeItem('drinkgames_session');
        resolve();
      });
    });
  }, [socket]);

  const value = {
    socket,
    isConnected,
    player,
    lobby,
    error,
    setLobby,
    createLobby,
    joinLobby,
    leaveLobby,
    clearError: () => setError(null),
    isReconnecting,
    reconnectGameState,
    setReconnectGameState,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
