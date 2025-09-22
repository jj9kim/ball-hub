import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './assets/Header';
import Main from './assets/Main';
import Popup from './assets/Popup';
import GamePage from './assets/GamePage';

function HomePage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <>
      <Header />
      <Main
        isCalendarOpen={isCalendarOpen}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      <Popup
        trigger={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route (today) */}
        <Route path="/" element={<HomePage />} />

        {/* Specific date route */}
        <Route path="/:date" element={<HomePage />} />

        {/* Game page with date context */}
        <Route path="/:date/game/:id" element={<GamePage />} />

        {/* Fallback for game pages without date (backward compatibility) */}
        <Route path="/game/:id" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;