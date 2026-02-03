import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import DeadDrawPoker from '../games/DeadDrawPoker';
import DrawingGame from '../games/DrawingGame';
import MultiplyMadness from '../games/MultiplyMadness';

export default function Game() {
  const navigate = useNavigate();
  const { player, lobby } = useSocket();
  const { currentGame, endGame } = useGame();

  useEffect(() => {
    if (!lobby) {
      navigate('/');
    }
  }, [lobby, navigate]);

  useEffect(() => {
    if (lobby && !currentGame) {
      navigate('/lobby');
    }
  }, [lobby, currentGame, navigate]);

  if (!lobby || !player || !currentGame) {
    return null;
  }

  const isHost = lobby.hostId === player.id;

  const handleEndGame = async () => {
    try {
      await endGame();
    } catch (err) {
      console.error('Failed to end game:', err);
    }
  };

  const gameProps = {
    player,
    lobby,
    isHost,
    onEndGame: handleEndGame,
  };

  switch (currentGame) {
    case 'dead-draw-poker':
      return <DeadDrawPoker {...gameProps} />;
    case 'drawing-game':
      return <DrawingGame {...gameProps} />;
    case 'multiply-madness':
      return <MultiplyMadness {...gameProps} />;
    default:
      return (
        <div className="page page-center">
          <p>Unknown game: {currentGame}</p>
          {isHost && (
            <button className="btn btn-primary mt-2" onClick={handleEndGame}>
              Back to Lobby
            </button>
          )}
        </div>
      );
  }
}
