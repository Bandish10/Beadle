import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DailyGame from './components/DailyGame';
import StreakGame from './components/StreakGame';
import GoogleAnalytics from './components/GoogleAnalytics';
import VisitorCount from './components/VisitorCount';
import './styles/components.css';

export default function App() {
  return (
    <BrowserRouter>
      <GoogleAnalytics />
      <Routes>
        <Route path="/" element={<DailyGame />} />
        <Route path="/streak" element={<StreakGame />} />
      </Routes>
      <VisitorCount />
    </BrowserRouter>
  );
}
