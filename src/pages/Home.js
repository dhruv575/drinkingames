import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { isConnected, createLobby, joinLobby, error, clearError } = useSocket();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [username, setUsername] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (username.length < 4) {
      setLocalError('Username must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'create') {
        await createLobby(username);
        navigate('/lobby');
      } else {
        if (lobbyCode.length !== 4) {
          setLocalError('Lobby code must be 4 letters');
          setLoading(false);
          return;
        }
        await joinLobby(username, lobbyCode);
        navigate('/lobby');
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="logo-section">
          <h1 className="app-title">Drinkingames</h1>
          <p className="app-tagline">Party games for good times</p>
        </div>

        {!mode ? (
          <div className="mode-selection animate-slide-up">
            <button
              className="btn btn-primary btn-large btn-full"
              onClick={() => setMode('create')}
              disabled={!isConnected}
            >
              Create Game
            </button>
            <button
              className="btn btn-secondary btn-large btn-full"
              onClick={() => setMode('join')}
              disabled={!isConnected}
            >
              Join Game
            </button>
            {!isConnected && (
              <p className="connection-status">
                <span className="status-dot disconnected" /> Connecting to server...
              </p>
            )}
          </div>
        ) : (
          <form className="join-form animate-slide-up" onSubmit={handleSubmit}>
            <button
              type="button"
              className="back-link"
              onClick={() => {
                setMode(null);
                setLocalError('');
                clearError();
              }}
            >
              ← Back
            </button>

            <h2 className="form-title">
              {mode === 'create' ? 'Create a Game' : 'Join a Game'}
            </h2>

            {displayError && (
              <div className="error-message">{displayError}</div>
            )}

            <div className="form-group">
              <label htmlFor="username">Your Name</label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                autoComplete="off"
                autoFocus
              />
            </div>

            {mode === 'join' && (
              <div className="form-group">
                <label htmlFor="lobbyCode">Game Code</label>
                <input
                  id="lobbyCode"
                  type="text"
                  className="input input-large"
                  placeholder="XXXX"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value.toUpperCase().slice(0, 4))}
                  maxLength={4}
                  autoComplete="off"
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-large btn-full"
              disabled={loading || !isConnected}
            >
              {loading ? 'Loading...' : mode === 'create' ? 'Create Game' : 'Join Game'}
            </button>
          </form>
        )}
      </div>

      <footer className="home-footer">
        <p>Play responsibly. 21+ only.</p>
      </footer>
    </div>
  );
}
