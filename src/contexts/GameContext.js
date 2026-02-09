import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { socket, setLobby, reconnectGameState, setReconnectGameState } = useSocket();
  const [currentGame, setCurrentGame] = useState(null);
  const [gamePhase, setGamePhase] = useState(null);
  const [gameData, setGameData] = useState({});
  const [results, setResults] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Fetch available games
    socket.emit('games:list', (response) => {
      if (response.games) {
        setAvailableGames(response.games);
      }
    });

    // Game events
    socket.on('game:started', (data) => {
      setCurrentGame(data.gameId);
      setLobby(data.lobby);
      setGamePhase(null);
      setGameData({});
      setResults(null);
    });

    socket.on('game:phase', (data) => {
      setGamePhase(data.phase);
      if (data.timeLimit) {
        setGameData(prev => ({ ...prev, timeLimit: data.timeLimit }));
      }
      if (data.word) {
        setGameData(prev => ({ ...prev, word: data.word }));
      }
      if (data.questions) {
        setGameData(prev => ({ ...prev, questions: data.questions }));
      }
      if (data.penaltyTime) {
        setGameData(prev => ({ ...prev, penaltyTime: data.penaltyTime }));
      }
      if (data.grid) {
        setGameData(prev => ({ ...prev, grid: data.grid }));
      }
    });

    socket.on('game:hole-cards', (data) => {
      setGameData(prev => ({ ...prev, holeCards: data.cards }));
    });

    socket.on('game:hole-cards-complete', () => {
      setGameData(prev => ({ ...prev, holeCardsDealt: true }));
    });

    socket.on('game:community-card', (data) => {
      setGameData(prev => ({
        ...prev,
        communityCards: data.communityCards,
        lastCard: data.card,
        lastCardPosition: data.position
      }));
    });

    socket.on('game:word-submitted', (data) => {
      setGameData(prev => ({
        ...prev,
        wordSubmissions: [...(prev.wordSubmissions || []), data]
      }));
    });

    socket.on('game:drawing-submitted', (data) => {
      setGameData(prev => ({
        ...prev,
        drawingSubmissions: [...(prev.drawingSubmissions || []), data]
      }));
    });

    socket.on('game:show-drawing', (data) => {
      setGameData(prev => ({
        ...prev,
        currentDrawing: data
      }));
    });

    socket.on('game:player-solved', (data) => {
      setGameData(prev => ({
        ...prev,
        solvedPlayers: [...(prev.solvedPlayers || []), data]
      }));
    });

    socket.on('game:results', (data) => {
      setResults(data);
    });

    socket.on('game:ended', (data) => {
      setCurrentGame(null);
      setGamePhase(null);
      setGameData({});
      setResults(null);
      setLobby(data.lobby);
    });

    return () => {
      socket.off('game:started');
      socket.off('game:phase');
      socket.off('game:hole-cards');
      socket.off('game:hole-cards-complete');
      socket.off('game:community-card');
      socket.off('game:word-submitted');
      socket.off('game:drawing-submitted');
      socket.off('game:show-drawing');
      socket.off('game:player-solved');
      socket.off('game:results');
      socket.off('game:ended');
    };
  }, [socket, setLobby]);

  // Restore game state after reconnection
  useEffect(() => {
    if (!reconnectGameState) return;

    const { gameId, phase, results, ...rest } = reconnectGameState;

    if (gameId) {
      setCurrentGame(gameId);
    }
    if (phase) {
      setGamePhase(phase);
    }
    if (results) {
      setResults(results);
    }

    // Restore game-specific data
    const gameData = {};
    if (rest.timeLimit !== undefined) gameData.timeLimit = rest.timeLimit;
    if (rest.word) gameData.word = rest.word;
    if (rest.questions) gameData.questions = rest.questions;
    if (rest.penaltyTime !== undefined) gameData.penaltyTime = rest.penaltyTime;
    if (rest.holeCards) gameData.holeCards = rest.holeCards;
    if (rest.communityCards) gameData.communityCards = rest.communityCards;
    if (rest.currentDrawing) gameData.currentDrawing = rest.currentDrawing;
    if (rest.grid) gameData.grid = rest.grid;
    if (rest.solvedPlayers) gameData.solvedPlayers = rest.solvedPlayers;
    if (rest.solved !== undefined) gameData.solved = rest.solved;

    if (Object.keys(gameData).length > 0) {
      setGameData(gameData);
    }

    setReconnectGameState(null);
  }, [reconnectGameState, setReconnectGameState]);

  const startGame = useCallback((gameId) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('game:start', { gameId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [socket]);

  const sendGameAction = useCallback((action, data = {}) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('game:action', { action, data }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [socket]);

  const endGame = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('game:end', (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [socket]);

  const value = {
    currentGame,
    gamePhase,
    gameData,
    results,
    availableGames,
    startGame,
    sendGameAction,
    endGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
