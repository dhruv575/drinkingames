import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <SocketProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </GameProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;
