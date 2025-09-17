import React from "react";

interface MainProps {
    isCalendarOpen: boolean;
    onOpenCalendar: () => void;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

function Main({ isCalendarOpen, onOpenCalendar, selectedDate, onDateSelect }: MainProps) {
    // Function to get display text for the date
    const getDateDisplayText = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        if (compareDate.getTime() === today.getTime()) {
            return "Today";
        } else if (compareDate.getTime() === yesterday.getTime()) {
            return "Yesterday";
        } else if (compareDate.getTime() === tomorrow.getTime()) {
            return "Tomorrow";
        } else {
            // Format date as MM/DD/YYYY
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }
    };

    // Function to change the selected date by offset days
    const changeDate = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + offset);
        onDateSelect(newDate);
    };

    return (
        <React.Fragment>
            {/* Date bar - always visible regardless of calendar state */}
            <div className="z-1000 w-screen border-4 border-white text-white flex justify-center bg-[#1a1a1a]">
                <div className="border-4 border-red-500 w-1/2 flex justify-between py-2">
                    <button
                        className="hover:text-[#9f9f9f] text-xl font-bold pl-2"
                        onClick={() => changeDate(-1)}
                    >
                        &lt;
                    </button>
                    <button
                        className="hover:text-[#9f9f9f] flex flex-row justify-center items-center w-30"
                        onClick={onOpenCalendar}
                    >
                        {getDateDisplayText(selectedDate)}&nbsp;
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className={`pt-0.5 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`}
                        >
                            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                        </svg>
                    </button>
                    <button
                        className="hover:text-[#9f9f9f] text-xl font-bold pr-2"
                        onClick={() => changeDate(1)}
                    >
                        &gt;
                    </button>
                </div>
            </div>

            {/* Rest of your main content would go here */}
            <div className="p-4">
                <h1>Your App Content</h1>
                <p>Selected date: {selectedDate.toDateString()}</p>
            </div>
        </React.Fragment>
    );
}

export default Main;