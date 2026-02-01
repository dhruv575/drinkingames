import { useSocket } from '../contexts/SocketContext';
import './Header.css';

export default function Header({ title, showBack, onBack }) {
  const { isConnected } = useSocket();

  return (
    <header className="header">
      <div className="header-left">
        {showBack && (
          <button className="back-button" onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      <h1 className="header-title">{title || 'Drinkingames'}</h1>

      <div className="header-right">
        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
      </div>
    </header>
  );
}
