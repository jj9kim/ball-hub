import { useParams } from 'react-router-dom';


export default function GamePage() {
    const { date, id } = useParams<{ date?: string; id: string }>();

    return (
        <div className="min-h-screen bg-[#1d1d1d] text-white p-6">

            <h1 className="text-3xl font-bold mb-2">Game Stats: {id}</h1>
            {date && <p className="text-gray-400 mb-4">Date: {new Date(date).toLocaleDateString()}</p>}

            {/* Your game stats content here */}
            <div className="bg-[#2d2d2d] p-4 rounded">
                <p>Game details will be displayed here</p>
                <p>Game ID: {id}</p>
                {date && <p>Date: {date}</p>}
            </div>
        </div>
    );
}