import { useState } from 'react';
import Header from './assets/Header';
import Main from './assets/Main';
import Popup from './assets/Popup';

function App() {
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

export default App;