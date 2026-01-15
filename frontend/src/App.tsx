import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './assets/Header';
import Main from './assets/Main';
import Popup from './assets/Popup';
import GamePage from './assets/GamePage';
import TeamsPage from './assets/components/TeamPage';
import TeamProfile from './assets/components/TeamProfile';

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

        {/* NEW ROUTES - Add these */}
        <Route path="/teams" element={
          <Layout>
            <TeamsPage />
          </Layout>
        } />

        <Route path="/player-stats" element={
          <Layout>
            <div className="min-h-screen bg-[#1a1a1a] p-8">
              <div className="text-white text-center">
                <h1 className="text-4xl font-bold mb-4">Player Stats</h1>
                <p>Player stats page coming soon!</p>
              </div>
            </div>
          </Layout>
        } />

        {/* Team Profile routes WITH Layout */}
        <Route path="/team/:teamId" element={
          <Layout>
            <TeamProfile />
          </Layout>
        } />

        <Route path="/team/:teamId/:teamName" element={
          <Layout>
            <TeamProfile />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;