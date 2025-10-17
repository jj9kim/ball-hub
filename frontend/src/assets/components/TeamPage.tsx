// TeamsPage.tsx
import { useNavigate } from 'react-router-dom';

export default function TeamsPage() {
    const navigate = useNavigate();

    const handleTeamClick = (teamId: number) => {
        // Navigate to individual team page
        navigate(`/team/${teamId}`);
    };

    const handleBack = () => {
        navigate(-1); // Go back to previous page
    };

    return (
        <div className="min-h-screen bg-black p-8 z-10000">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={handleBack}
                        className="text-white text-2xl mr-4 hover:text-[#9f9f9f]"
                    >
                        ←
                    </button>
                    <h1 className="text-4xl font-bold text-white">NBA Teams</h1>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Example team cards - you can replace with your actual teams data */}
                    <div
                        className="bg-[#2c2c2c] rounded-lg p-6 hover:bg-[#393939] transition-colors cursor-pointer"
                        onClick={() => handleTeamClick(1)}
                    >
                        <h3 className="text-white text-xl font-bold text-center">Atlanta Hawks</h3>
                    </div>

                    <div
                        className="bg-[#2c2c2c] rounded-lg p-6 hover:bg-[#393939] transition-colors cursor-pointer"
                        onClick={() => handleTeamClick(2)}
                    >
                        <h3 className="text-white text-xl font-bold text-center">Boston Celtics</h3>
                    </div>

                    {/* Add more teams as needed */}
                </div>

                <div className="mt-8 text-center text-gray-400">
                    <p>Teams page content goes here - customize as needed!</p>
                </div>
            </div>
        </div>
    );
}