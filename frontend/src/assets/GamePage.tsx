import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTeamLogoUrl, getTeamName } from '../utils/teamMappings';

export default function GamePage() {
    const { date, id } = useParams<{ date?: string; id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const teamsThisGame = location.state.teamsThisGame

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
        <div className='w-full flex flex-row justify-center'>
            <div className="min-h-[80vh] bg-[#1d1d1d] text-white w-2/3 flex flex-col mt-25 border-2 border-red-500 rounded-2xl mr-5">
                <div className="grid grid-cols-3 items-center pb-5 pt-5 border-b-2 border-b-[#5b5b5b33]">
                    {/* Left button */}
                    <div className="flex justify-start">
                        <button
                            onClick={handleBack}
                            className="px-4 rounded hover:underline hover:font-bold"
                        >
                            ← Games
                        </button>
                    </div>

                    {/* Center logo + text */}
                    <div className="flex flex-row items-center justify-center">
                        <img
                            src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7"
                            alt="NBA"
                            className="w-8 h-8"
                        />
                        <p className="ml-2">NBA</p>
                    </div>

                    {/* Right button */}
                    <div className="flex justify-end pr-5">
                        <button className="hover:font-bold hover:underline">Follow</button>
                    </div>
                </div>

                <div className='pt-10 border-b-2 border-b-[#5b5b5b33]'></div>
                <div className="flex flex-col w-full pt-5">
                    <div className='flex flex-row pb-10 justify-center'>
                        {/* Team 1 */}
                        <div className="flex items-center mr-10">
                            <p className="mr-5 text-white text-2xl">{getTeamName(teamsThisGame[0].team_id)}</p>
                            <img
                                src={getTeamLogoUrl(teamsThisGame[0].team_id)}
                                alt={teamsThisGame[0].team_id.toString()}
                                className="w-16 h-16 mr-7"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>

                        {/* Scores - Centered */}
                        <div className="flex flex-col pb-5 items-center">
                            <div className="flex items-center gap-2">
                                <p className="text-white text-2xl">{teamsThisGame[0].points}</p>
                                <span className="text-gray-400 text-2xl">-</span>
                                <p className="text-white text-2xl">{teamsThisGame[1].points}</p>
                            </div>
                            <p className="text-gray-400 text-lg pt-5">Final</p>
                        </div>


                        {/* Team 2 */}
                        <div className="flex items-center ml-10">
                            <img
                                src={getTeamLogoUrl(teamsThisGame[1].team_id)}
                                alt={teamsThisGame[1].team_id.toString()}
                                className="w-16 h-16 mr-7"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <p className="text-white text-2xl">{getTeamName(teamsThisGame[1].team_id)}</p>
                        </div>
                    </div>
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
            <div className='border-2 border-amber-400 w-1/5 mt-25 rounded-2xl'></div>
        </div>
    );
}