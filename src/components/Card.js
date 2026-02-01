import './Card.css';

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors = {
  hearts: '#ef4444',
  diamonds: '#ef4444',
  clubs: '#1f2937',
  spades: '#1f2937'
};

export default function Card({ card, faceDown = false, size = 'medium', animate = false }) {
  if (!card) return null;

  const { suit, rank } = card;
  const symbol = suitSymbols[suit];
  const color = suitColors[suit];

  return (
    <div className={`playing-card ${size} ${faceDown ? 'face-down' : ''} ${animate ? 'animate' : ''}`}>
      {faceDown ? (
        <div className="card-back">
          <div className="card-pattern" />
        </div>
      ) : (
        <div className="card-front" style={{ color }}>
          <div className="card-corner top-left">
            <span className="card-rank">{rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
          <div className="card-center">
            <span className="card-suit-large">{symbol}</span>
          </div>
          <div className="card-corner bottom-right">
            <span className="card-rank">{rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
        </div>
      )}
    </div>
  );
}
