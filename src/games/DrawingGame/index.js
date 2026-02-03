import { useState, useRef, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/Header';
import Timer from '../../components/Timer';
import './DrawingGame.css';

const COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
];

export default function DrawingGame({ player, lobby, isHost, onEndGame }) {
  const { gamePhase, gameData, results, sendGameAction } = useGame();
  const [word, setWord] = useState('');
  const [wordSubmitted, setWordSubmitted] = useState(false);
  const [drawingSubmitted, setDrawingSubmitted] = useState(false);
  const [currentVote, setCurrentVote] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Canvas setup - only runs when entering drawing phase
  useEffect(() => {
    if (gamePhase === 'drawing' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Drawing style
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [gamePhase]);

  // Update stroke color when selectedColor changes
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = selectedColor;
    }
  }, [selectedColor]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    if (drawingSubmitted) return;
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || drawingSubmitted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (drawingSubmitted) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmitWord = async () => {
    if (!word.trim() || wordSubmitted) return;
    try {
      await sendGameAction('submit-word', { word: word.trim() });
      setWordSubmitted(true);
    } catch (err) {
      console.error('Failed to submit word:', err);
    }
  };

  const handleSubmitDrawing = async () => {
    if (drawingSubmitted) return;
    const canvas = canvasRef.current;
    const drawing = canvas.toDataURL('image/png');
    try {
      await sendGameAction('submit-drawing', { drawing });
      setDrawingSubmitted(true);
    } catch (err) {
      console.error('Failed to submit drawing:', err);
    }
  };

  const handleVote = async (voteType) => {
    if (!gameData.currentDrawing) return;
    // Can't vote for own drawing
    if (gameData.currentDrawing.drawingPlayerId === player.id) return;
    if (currentVote) return;

    try {
      await sendGameAction('vote', {
        drawingOwnerId: gameData.currentDrawing.drawingPlayerId,
        voteType
      });
      setCurrentVote(voteType);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  // Reset vote when viewing index changes
  useEffect(() => {
    setCurrentVote(null);
  }, [gameData.currentDrawing?.index]);

  const renderPhase = () => {
    switch (gamePhase) {
      case 'word-submission':
        return (
          <div className="phase-content">
            <div className="phase-header">
              <h2>Submit a Word</h2>
              <p>Enter a word for others to draw</p>
            </div>

            {gameData.timeLimit && (
              <Timer key="word-submission" duration={gameData.timeLimit} label="Time remaining" />
            )}

            {!wordSubmitted ? (
              <div className="word-input-section">
                <input
                  type="text"
                  className="input"
                  placeholder="Enter a word..."
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleSubmitWord}
                  disabled={!word.trim()}
                >
                  Submit Word
                </button>
              </div>
            ) : (
              <div className="submitted-status">
                <div className="check-icon">✓</div>
                <p>Word submitted! Waiting for others...</p>
                <p className="submissions-count">
                  {gameData.wordSubmissions?.length || 1} / {lobby.players.length} submitted
                </p>
              </div>
            )}
          </div>
        );

      case 'drawing':
        return (
          <div className="phase-content drawing-phase">
            <div className="phase-header">
              <h2>Draw: {gameData.word}</h2>
            </div>

            {gameData.timeLimit && (
              <Timer key="drawing" duration={gameData.timeLimit} label="Time remaining" />
            )}

            <div className="color-picker">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  disabled={drawingSubmitted}
                />
              ))}
            </div>

            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            {!drawingSubmitted ? (
              <div className="drawing-actions">
                <button className="btn btn-secondary" onClick={clearCanvas}>
                  Clear
                </button>
                <button className="btn btn-primary" onClick={handleSubmitDrawing}>
                  Submit Drawing
                </button>
              </div>
            ) : (
              <div className="submitted-status">
                <div className="check-icon">✓</div>
                <p>Drawing submitted!</p>
              </div>
            )}
          </div>
        );

      case 'viewing':
        const currentDrawing = gameData.currentDrawing;
        if (!currentDrawing) return <p>Loading...</p>;

        const isOwnDrawing = currentDrawing.drawingPlayerId === player.id;

        return (
          <div className="phase-content viewing-phase">
            <div className="phase-header">
              <h2>{currentDrawing.drawingPlayerUsername}'s Drawing</h2>
              <p>{currentDrawing.index + 1} of {currentDrawing.total}</p>
            </div>

            <div className="viewing-drawing">
              {currentDrawing.drawing ? (
                <img src={currentDrawing.drawing} alt="Drawing" />
              ) : (
                <div className="no-drawing">No drawing submitted</div>
              )}
            </div>

            {!isOwnDrawing && (
              <div className="voting-buttons">
                <button
                  className={`vote-btn up ${currentVote === 'up' ? 'selected' : ''}`}
                  onClick={() => handleVote('up')}
                  disabled={currentVote !== null}
                >
                  👍
                </button>
                <button
                  className={`vote-btn down ${currentVote === 'down' ? 'selected' : ''}`}
                  onClick={() => handleVote('down')}
                  disabled={currentVote !== null}
                >
                  👎
                </button>
              </div>
            )}

            {isOwnDrawing && (
              <p className="own-drawing-note">This is your drawing</p>
            )}
          </div>
        );

      case 'results':
        return renderResults();

      default:
        return (
          <div className="phase-content">
            <h2>Starting game...</h2>
          </div>
        );
    }
  };

  const renderResults = () => {
    if (!results) return null;

    const loserIds = results.losers.map(l => l.playerId);
    const isLoser = loserIds.includes(player.id);

    return (
      <div className="results-container">
        <div className={`result-banner ${isLoser ? 'loser' : 'safe'}`}>
          <h2>{isLoser ? 'You Lose!' : 'You\'re Safe!'}</h2>
          <p>The word was: <strong>{results.word}</strong></p>
        </div>

        <div className="loser-section">
          <h3>{results.losers.length > 1 ? 'Losers' : 'Loser'}</h3>
          <div className="loser-names">
            {results.losers.map(l => l.username).join(' & ')}
          </div>
        </div>

        <div className="all-scores">
          <h3>All Scores</h3>
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
                    👍 {p.thumbsUp} · 👎 {p.thumbsDown}
                  </span>
                </div>
                <div className={`score-value ${p.netScore < 0 ? 'negative' : p.netScore > 0 ? 'positive' : ''}`}>
                  {p.netScore > 0 ? '+' : ''}{p.netScore}
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
    <div className="drawing-game">
      <Header title="Drawing Game" />
      <div className="game-content">
        {renderPhase()}
      </div>
    </div>
  );
}
