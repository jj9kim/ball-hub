import { useState, useEffect, useRef } from 'react';

interface PopupProps {
    trigger: boolean;
    children?: React.ReactNode;
    onClose: () => void;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

function Popup({ trigger, children, onClose, selectedDate, onDateSelect }: PopupProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const popupRef = useRef<HTMLDivElement>(null);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (trigger) {
            document.addEventListener('mousedown', handleClickOutside);
            // Prevent scrolling when calendar is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [trigger, onClose]);

    // Generate calendar days for the current month view (6 weeks)
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay(); // 0 (Sunday) to 6 (Saturday)

        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Days from previous month to show
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            days.push({ date, isCurrentMonth: false, day });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({ date, isCurrentMonth: true, day: i });
        }

        // Next month days (to complete 6 weeks)
        const totalCells = 42; // 6 weeks * 7 days
        const nextMonthDays = totalCells - days.length;
        for (let i = 1; i <= nextMonthDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push({ date, isCurrentMonth: false, day: i });
        }

        return days;
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleDateSelect = (date: Date) => {
        onDateSelect(date);
        onClose(); // Close the calendar immediately after selecting a date
    };

    useEffect(() => {
        if (trigger) {
            setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        }
    }, [trigger, selectedDate]);

    if (!trigger) return null;

    const calendarDays = generateCalendarDays();
    const today = new Date(); // Get today's date for highlighting

    return (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/70 flex justify-center items-start z-1000 pt-50">
            <div ref={popupRef} className="relative p-4 w-full max-w-md bg-[#2b2b2b] rounded-lg shadow-xl">
                <div className="calendar-container">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-2 text-white hover:bg-blue-100 rounded-full"
                        >
                            &lt;
                        </button>
                        <span className="font-bold text-white">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-2 text-white hover:bg-blue-100 rounded-full"
                        >
                            &gt;
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {daysOfWeek.map(day => (
                            <div key={day} className="text-center font-bold text-white text-sm py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {calendarDays.map((day, index) => {
                            const isSelected = selectedDate &&
                                day.date.getDate() === selectedDate.getDate() &&
                                day.date.getMonth() === selectedDate.getMonth() &&
                                day.date.getFullYear() === selectedDate.getFullYear();

                            // Check if this day is today
                            const isToday = day.date.getDate() === today.getDate() &&
                                day.date.getMonth() === today.getMonth() &&
                                day.date.getFullYear() === today.getFullYear();

                            return (
                                <div
                                    key={index}
                                    className={`h-8 flex items-center justify-center rounded-full cursor-pointer transition-all text-sm relative
                    ${day.isCurrentMonth ? 'text-white' : 'text-gray-400'}
                    ${isSelected ? 'bg-white !text-[#2b2b2b]' : 'hover:bg-[#3333]'}`}
                                    onClick={() => handleDateSelect(day.date)}
                                >
                                    {day.day}
                                    {/* Light circle for today's date */}
                                    {isToday && !isSelected && (
                                        <div className="absolute inset-0 border-2 border-gray-500 rounded-full"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}

export default Popup;