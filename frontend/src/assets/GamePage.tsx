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

    const displayDate = date ? parseLocalDate(date) : null;

    return (
        <div className="min-h-[80vh] bg-[#1d1d1d] text-white w-2/3 flex flex-col mt-25 mx-auto border-2 border-red-500 rounded-2xl">
            <div className="flex flex-row justify-between pb-5 pt-5 border-b-2 border-b-[#5b5b5b33]">
                <button
                    onClick={handleBack}
                    className="px-4 rounded hover:underline hover:font-bold"
                >
                    ← Games
                </button>
                <div className='flex flex-row'>
                    <img src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7" alt="NBA" className="w-8 h-8" />
                    <p className='p-1'>NBA</p>
                </div>
                <button className='text-white pr-5 hover:font-bold hover:underline'>Follow</button>
            </div>
            <div className='pt-10 border-b-2 border-b-[#5b5b5b33]'></div>
            <div className="container mx-auto px-4 w-full pt-5">
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