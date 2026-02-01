import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import Header from '../components/Header';
import PlayerList from '../components/PlayerList';
import './Lobby.css';

export default function Lobby() {
  const navigate = useNavigate();
  const { player, lobby, leaveLobby } = useSocket();
  const { availableGames, currentGame, startGame } = useGame();

  useEffect(() => {
    if (!lobby) {
      navigate('/');
    }
  }, [lobby, navigate]);

  useEffect(() => {
    if (currentGame) {
      navigate('/game');
    }
  }, [currentGame, navigate]);

  if (!lobby || !player) {
    return null;
  }

  const isHost = lobby.hostId === player.id;

  const handleLeave = async () => {
    await leaveLobby();
    navigate('/');
  };

  const handleStartGame = async (gameId) => {
    try {
      await startGame(gameId);
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(lobby.code);
  };

  return (
    <div className="lobby-page">
      <Header title="Lobby" showBack onBack={handleLeave} />

      <div className="lobby-content">
        <div className="lobby-code-section">
          <p className="code-label">Share this code with friends:</p>
          <button className="lobby-code" onClick={copyCode}>
            <span className="code-text">{lobby.code}</span>
            <span className="copy-hint">Tap to copy</span>
          </button>
        </div>

        <PlayerList players={lobby.players} currentPlayerId={player.id} />

        {isHost ? (
          <div className="game-selection">
            <h3 className="section-title">Choose a Game</h3>
            <div className="game-list">
              {availableGames.map((game) => (
                <button
                  key={game.id}
                  className="game-card"
                  onClick={() => handleStartGame(game.id)}
                  disabled={lobby.players.length < game.minPlayers}
                >
                  <h4 className="game-name">{game.name}</h4>
                  <p className="game-description">{game.description}</p>
                  {lobby.players.length < game.minPlayers && (
                    <p className="game-requirement">
                      Need {game.minPlayers}+ players
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="waiting-section">
            <div className="waiting-indicator">
              <div className="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Waiting for host to start a game...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
