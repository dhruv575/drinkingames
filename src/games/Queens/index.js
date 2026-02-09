import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/Header';
import './Queens.css';

const REGION_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
];

function formatTime(ms) {
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

export default function Queens({ player, lobby, isHost, onEndGame }) {
  const { gamePhase, gameData, results, sendGameAction } = useGame();
  const [queens, setQueens] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'incorrect' | null
  const [hasSolved, setHasSolved] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const grid = gameData.grid || null;
  const solvedPlayers = gameData.solvedPlayers || [];

  // Start timer when game begins
  useEffect(() => {
    if (gamePhase === 'playing' && gameData.timeLimit) {
      const start = Date.now();
      const duration = gameData.timeLimit;

      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gamePhase, gameData.timeLimit]);

  // Restore solved state on reconnect
  useEffect(() => {
    if (gameData.solved) {
      setHasSolved(true);
    }
  }, [gameData.solved]);

  const toggleQueen = useCallback((row, col) => {
    if (hasSolved || gamePhase !== 'playing') return;

    setFeedback(null);

    setQueens(prev => {
      const existing = prev.findIndex(q => q.row === row && q.col === col);
      if (existing !== -1) {
        return prev.filter((_, i) => i !== existing);
      }
      if (prev.length >= 6) return prev;
      return [...prev, { row, col }];
    });
  }, [hasSolved, gamePhase]);

  const handleSubmit = useCallback(async () => {
    if (queens.length !== 6 || hasSolved) return;

    try {
      const result = await sendGameAction('submit-solution', { queens });
      if (result.correct) {
        setHasSolved(true);
        setFeedback(null);
      } else {
        setFeedback('incorrect');
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch (err) {
      console.error('Failed to submit solution:', err);
    }
  }, [queens, hasSolved, sendGameAction]);

  const getCellBorders = useCallback((row, col) => {
    if (!grid) return '';
    const classes = [];
    const regionId = grid[row][col];

    // Top border: if top edge or different region above
    if (row === 0 || grid[row - 1][col] !== regionId) {
      classes.push('border-top-thick');
    }
    // Bottom border: if bottom edge or different region below
    if (row === 5 || grid[row + 1][col] !== regionId) {
      classes.push('border-bottom-thick');
    }
    // Left border: if left edge or different region to the left
    if (col === 0 || grid[row][col - 1] !== regionId) {
      classes.push('border-left-thick');
    }
    // Right border: if right edge or different region to the right
    if (col === 5 || grid[row][col + 1] !== regionId) {
      classes.push('border-right-thick');
    }

    return classes.join(' ');
  }, [grid]);

  const renderGame = () => {
    if (!grid) {
      return <div className="phase-content"><p>Loading puzzle...</p></div>;
    }

    const solvedCount = solvedPlayers.length;
    const totalPlayers = lobby.players.length;

    return (
      <div className="phase-content">
        <div className="game-stats">
          <div className="stat">
            <span className="stat-value time">{timeLeft}</span>
            <span className="stat-label">seconds</span>
          </div>
          <div className="stat">
            <span className="stat-value">{queens.length}/6</span>
            <span className="stat-label">queens</span>
          </div>
          <div className="stat">
            <span className="stat-value solved-count">{solvedCount}/{totalPlayers}</span>
            <span className="stat-label">solved</span>
          </div>
        </div>

        <div className="queens-grid">
          {grid.map((row, r) =>
            row.map((regionId, c) => {
              const hasQueen = queens.some(q => q.row === r && q.col === c);
              const bgColor = REGION_COLORS[regionId] || '#666';
              const borderClasses = getCellBorders(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`queens-cell ${borderClasses}`}
                  style={{ backgroundColor: `${bgColor}25` }}
                  onClick={() => toggleQueen(r, c)}
                >
                  {hasQueen && <span className="queen-icon">&#9819;</span>}
                </div>
              );
            })
          )}
        </div>

        <div className={`feedback-msg ${feedback || ''}`}>
          {feedback === 'incorrect' && 'Incorrect placement! Check the rules and try again.'}
        </div>

        {hasSolved ? (
          <div className="solved-banner">
            <h3>Puzzle Solved!</h3>
            <p>Waiting for other players...</p>
          </div>
        ) : (
          <button
            className="submit-btn"
            disabled={queens.length !== 6}
            onClick={handleSubmit}
          >
            Submit Solution
          </button>
        )}

        {solvedCount > 0 && (
          <div className="solved-list">
            {solvedPlayers.map(sp => (
              <div key={sp.playerId}>
                {sp.username} solved in {formatTime(sp.solveTime)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!results) return null;

    const loserIds = results.losers.map(l => l.playerId);
    const isLoser = loserIds.includes(player.id);
    const myResult = results.players.find(p => p.playerId === player.id);

    return (
      <div className="results-container">
        <div className={`result-banner ${isLoser ? 'loser' : 'safe'}`}>
          <h2>{isLoser ? 'You Lose!' : "You're Safe!"}</h2>
          <p>
            {myResult?.solved
              ? `Solved in ${formatTime(myResult.solveTime)}`
              : 'Did not solve'}
          </p>
        </div>

        <div className="loser-section">
          <h3>{results.losers.length > 1 ? 'Losers' : 'Loser'}</h3>
          <div className="loser-names">
            {results.losers.map(l => l.username).join(' & ')}
          </div>
        </div>

        <div className="all-scores">
          <h3>All Players</h3>
          {results.players.map((p) => {
            const isPlayerLoser = loserIds.includes(p.playerId);
            return (
              <div
                key={p.playerId}
                className={`score-result ${isPlayerLoser ? 'loser' : ''} ${p.playerId === player.id ? 'is-you' : ''}`}
              >
                <div className="score-info">
                  <span className="score-player">
                    {p.username}
                    {p.playerId === player.id && ' (You)'}
                  </span>
                  <span className="score-detail">
                    {p.solved
                      ? `Solved in ${formatTime(p.solveTime)}`
                      : 'Did not solve'}
                  </span>
                </div>
                <div className={`score-value ${p.solved ? 'solved' : 'not-solved'}`}>
                  {p.solved ? formatTime(p.solveTime) : 'DNF'}
                </div>
              </div>
            );
          })}
        </div>

        {isHost && (
          <button className="btn btn-primary btn-full mt-3" onClick={onEndGame}>
            Back to Lobby
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="queens-game">
      <Header title="Queens" />
      <div className="game-content">
        {gamePhase === 'results' ? renderResults() : renderGame()}
      </div>
    </div>
  );
}
