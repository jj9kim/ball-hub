import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './assets/Header';
import Main from './assets/Main';
import Popup from './assets/Popup';
import GamePage from './assets/GamePage';

// Layout component that includes Header for all pages
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

function HomePage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Layout>
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
    </Layout>
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

        {/* Game page with Header */}
        <Route path="/:date/game/:id" element={
          <Layout>
            <GamePage />
          </Layout>
        } />

        {/* Fallback for game pages without date */}
        <Route path="/game/:id" element={
          <Layout>
            <GamePage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;