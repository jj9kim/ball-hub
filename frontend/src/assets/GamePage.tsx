import { useParams, useNavigate } from 'react-router-dom';

export default function GamePage() {
    const { date, id } = useParams<{ date?: string; id: string }>();
    const navigate = useNavigate();

    // Fix: Parse the date correctly as local time
    const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        // This creates a date in LOCAL time, not UTC
        return new Date(year, month - 1, day);
    };

    const formatDateForURL = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleBack = () => {
        if (date) {
            navigate(`/${date}`);
        } else {
            const today = new Date();
            const todayString = formatDateForURL(today);
            navigate(`/${todayString}`);
        }
    };

    // Fix: Display the date correctly
    const displayDate = date ? parseLocalDate(date) : null;

    return (
        <div className="min-h-screen bg-[#1d1d1d] text-white pt-4">
            <div className="container mx-auto px-4">
                <button
                    onClick={handleBack}
                    className="bg-red-600 px-4 py-2 rounded mb-4 hover:bg-red-700"
                >
                    ← Back to {displayDate ? displayDate.toLocaleDateString() : 'Games'}
                </button>

                <h1 className="text-3xl font-bold mb-2">Game Stats: {id}</h1>
                {displayDate && (
                    <p className="text-gray-400 mb-4">
                        Date: {displayDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                )}

                {/* Your game stats content here */}
                <div className="bg-[#2d2d2d] p-4 rounded">
                    <p>Game details will be displayed here</p>
                    <p>Game ID: {id}</p>
                    {date && <p>Raw date from URL: {date}</p>}
                </div>
            </div>
        </div>
    );
}