import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/Header';
import './MultiplyMadness.css';

export default function MultiplyMadness({ player, lobby, isHost, onEndGame }) {
  const { gamePhase, gameData, results, sendGameAction } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [isPenalty, setIsPenalty] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameEnded, setGameEnded] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);
  const penaltyTimeoutRef = useRef(null);

  const questions = gameData.questions || [];
  const currentQuestion = questions[currentIndex];
  const penaltyTime = gameData.penaltyTime || 3000;

  // Start timer when game begins
  useEffect(() => {
    if (gamePhase === 'playing' && gameData.timeLimit) {
      startTimeRef.current = Date.now();
      const duration = gameData.timeLimit;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          setGameEnded(true);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gamePhase, gameData.timeLimit]);

  // Submit score when game ends
  const submitScore = useCallback(async () => {
    if (scoreSubmitted) return;
    setScoreSubmitted(true);
    try {
      await sendGameAction('submit-score', { correct, wrong });
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
  }, [correct, wrong, sendGameAction, scoreSubmitted]);

  useEffect(() => {
    if (gameEnded && !scoreSubmitted) {
      submitScore();
    }
  }, [gameEnded, scoreSubmitted, submitScore]);

  // Focus input when not in penalty
  useEffect(() => {
    if (!isPenalty && !gameEnded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPenalty, gameEnded, currentIndex]);

  // Cleanup penalty timeout on unmount
  useEffect(() => {
    return () => {
      if (penaltyTimeoutRef.current) {
        clearTimeout(penaltyTimeoutRef.current);
      }
    };
  }, []);

  const moveToNext = useCallback(() => {
    setAnswer('');
    setFeedback(null);
    setIsPenalty(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handleAnswerChange = (e) => {
    if (isPenalty || gameEnded) return;

    const value = e.target.value.replace(/[^0-9]/g, '');
    setAnswer(value);

    // Auto-submit when 2 digits entered
    if (value.length === 2 && currentQuestion) {
      const isCorrect = parseInt(value) === currentQuestion.answer;

      if (isCorrect) {
        setCorrect(prev => prev + 1);
        setFeedback('correct');
        // Move to next immediately
        setTimeout(moveToNext, 300);
      } else {
        setWrong(prev => prev + 1);
        setFeedback('wrong');
        setIsPenalty(true);
        // Wait penalty time before moving on
        penaltyTimeoutRef.current = setTimeout(() => {
          moveToNext();
        }, penaltyTime);
      }
    }
  };

  const renderGame = () => {
    if (!currentQuestion) {
      return <div className="phase-content"><p>Loading questions...</p></div>;
    }

    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="phase-content">
        <div className="game-stats">
          <div className="stat">
            <span className="stat-value time">{timeLeft}</span>
            <span className="stat-label">seconds</span>
          </div>
          <div className="stat">
            <span className="stat-value correct">{correct}</span>
            <span className="stat-label">correct</span>
          </div>
          <div className="stat">
            <span className="stat-value wrong">{wrong}</span>
            <span className="stat-label">wrong</span>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className={`question-card ${feedback || ''} ${isPenalty ? 'penalty' : ''}`}>
          <div className="question">
            <span className="num">{currentQuestion.a}</span>
            <span className="operator">×</span>
            <span className="num">{currentQuestion.b}</span>
            <span className="equals">=</span>
            <span className="answer-display">{answer || '??'}</span>
          </div>

          {feedback === 'correct' && (
            <div className="feedback correct-feedback">Correct!</div>
          )}
          {feedback === 'wrong' && (
            <div className="feedback wrong-feedback">
              Wrong! {currentQuestion.a} × {currentQuestion.b} = {currentQuestion.answer}
            </div>
          )}
          {isPenalty && (
            <div className="penalty-timer">Wait 3 seconds...</div>
          )}
        </div>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          className="hidden-input"
          value={answer}
          onChange={handleAnswerChange}
          disabled={isPenalty || gameEnded}
          autoFocus
        />

        <p className="hint">Type your 2-digit answer</p>
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
          <h2>{isLoser ? 'You Lose!' : 'You\'re Safe!'}</h2>
          <p>You got <strong>{myResult?.correct || 0}</strong> correct</p>
        </div>

        <div className="loser-section">
          <h3>{results.losers.length > 1 ? 'Losers' : 'Loser'}</h3>
          <div className="loser-names">
            {results.losers.map(l => `${l.username} (${l.correct})`).join(' & ')}
          </div>
        </div>

        <div className="all-scores">
          <h3>All Scores</h3>
          {results.players.sort((a, b) => b.correct - a.correct).map((p) => {
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
                    {p.wrong} wrong
                  </span>
                </div>
                <div className="score-value positive">
                  {p.correct}
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
    <div className="multiply-game">
      <Header title="Multiply Madness" />
      <div className="game-content">
        {gamePhase === 'results' ? renderResults() : renderGame()}
      </div>
    </div>
  );
}
