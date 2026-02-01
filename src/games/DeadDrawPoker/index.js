import { useGame } from '../../contexts/GameContext';
import Header from '../../components/Header';
import Card from '../../components/Card';
import './DeadDrawPoker.css';

export default function DeadDrawPoker({ player, lobby, isHost, onEndGame }) {
  const { gamePhase, gameData, results } = useGame();

  const renderPhase = () => {
    switch (gamePhase) {
      case 'dealing-hole-cards':
        return (
          <div className="phase-container">
            <h2 className="phase-title">Dealing cards...</h2>
            <div className="dealing-animation">
              <Card faceDown size="large" />
            </div>
          </div>
        );

      case 'flop':
      case 'turn':
      case 'river':
        return (
          <div className="phase-container">
            <h2 className="phase-title">
              {gamePhase === 'flop' && 'The Flop'}
              {gamePhase === 'turn' && 'The Turn'}
              {gamePhase === 'river' && 'The River'}
            </h2>

            <div className="hole-cards">
              <p className="cards-label">Your Cards</p>
              <div className="cards-row">
                {gameData.holeCards?.map((card, i) => (
                  <Card key={i} card={card} size="medium" />
                ))}
              </div>
            </div>

            <div className="community-cards">
              <p className="cards-label">Community Cards</p>
              <div className="cards-row community">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="card-slot">
                    {gameData.communityCards?.[i] ? (
                      <Card
                        card={gameData.communityCards[i]}
                        size="medium"
                        animate={gameData.lastCardPosition === i}
                      />
                    ) : (
                      <div className="card-placeholder" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'results':
        return renderResults();

      default:
        return (
          <div className="phase-container">
            <h2 className="phase-title">Starting game...</h2>
            <div className="dealing-animation">
              <Card faceDown size="large" />
            </div>
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
          <p>{isLoser ? 'Time to drink!' : 'Lucky this time...'}</p>
        </div>

        <div className="loser-section">
          <h3>
            {results.losers.length > 1 ? 'Losers' : 'Loser'}
          </h3>
          <div className="loser-names">
            {results.losers.map(l => l.username).join(' & ')}
          </div>
        </div>

        <div className="all-hands">
          <h3>All Hands</h3>
          {results.players.map((p, index) => {
            const isPlayerLoser = loserIds.includes(p.playerId);
            return (
              <div
                key={p.playerId}
                className={`hand-result ${isPlayerLoser ? 'loser' : ''} ${p.playerId === player.id ? 'is-you' : ''}`}
              >
                <div className="hand-rank">#{results.players.length - index}</div>
                <div className="hand-info">
                  <span className="hand-player">
                    {p.username}
                    {p.playerId === player.id && ' (You)'}
                  </span>
                  <span className="hand-name">{p.handName}</span>
                </div>
                <div className="hand-cards">
                  {p.holeCards.map((card, i) => (
                    <Card key={i} card={card} size="small" />
                  ))}
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
    <div className="poker-game">
      <Header title="Dead Draw Poker" />
      <div className="poker-content">
        {renderPhase()}
      </div>
    </div>
  );
}
