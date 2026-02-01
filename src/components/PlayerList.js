import './PlayerList.css';

export default function PlayerList({ players, currentPlayerId }) {
  return (
    <div className="player-list">
      <h3 className="player-list-title">Players ({players.length}/8)</h3>
      <div className="player-list-items">
        {players.map((player) => (
          <div
            key={player.id}
            className={`player-item ${player.id === currentPlayerId ? 'is-you' : ''}`}
          >
            <div className="player-avatar">
              {player.username.charAt(0).toUpperCase()}
            </div>
            <span className="player-name">
              {player.username}
              {player.id === currentPlayerId && <span className="you-badge">(You)</span>}
            </span>
            {player.isHost && <span className="host-badge">Host</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
