import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DailyGame from './components/DailyGame';
import StreakGame from './components/StreakGame';
import './styles/components.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DailyGame />} />
        <Route path="/streak" element={<StreakGame />} />
      </Routes>
    </BrowserRouter>
  );
}
