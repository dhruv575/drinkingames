import { useState, useEffect } from 'react';
import './Timer.css';

export default function Timer({ duration, onComplete, label }) {
  const [timeLeft, setTimeLeft] = useState(Math.ceil(duration / 1000));
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, startTime, onComplete]);

  const progress = (timeLeft / (duration / 1000)) * 100;
  const isLow = timeLeft <= 5;

  return (
    <div className={`timer ${isLow ? 'low' : ''}`}>
      {label && <span className="timer-label">{label}</span>}
      <div className="timer-display">
        <span className="timer-value">{timeLeft}</span>
        <span className="timer-unit">s</span>
      </div>
      <div className="timer-bar">
        <div className="timer-progress" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
