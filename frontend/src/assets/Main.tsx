import React, { useEffect, useState } from "react";
import { getTeamLogoUrl, getTeamName } from '../utils/teamMappings';
import { useParams, useNavigate } from 'react-router-dom';

const formatDateForURL = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface MainProps {
    isCalendarOpen: boolean;
    onOpenCalendar: () => void;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

interface Game {
    game_id: string;
    game_date: string;
    home_team_id: number;
    away_team_id: number;
    home_team_score: number;
    away_team_score: number;
    matchup: string;
}

function Main({ isCalendarOpen, onOpenCalendar, selectedDate, onDateSelect }: MainProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { date: urlDate } = useParams<{ date?: string }>();
    const navigate = useNavigate();

    // Fetch games from Python backend
    useEffect(() => {
        // In your main.tsx, change the fetch to:
        const fetchGames = async () => {
            try {
                setLoading(true);
                setError(null);

                // Use the new NBA API endpoint from your Express server
                const response = await fetch('http://localhost:8081/api/nba/games/season/current');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const gamesData: Game[] = await response.json();
                setGames(gamesData);
                console.log('Fetched NBA games:', gamesData.length);

            } catch (err) {
                console.error('Error fetching NBA games:', err);
                setError('Failed to load NBA games data.');
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    // Sync selectedDate with URL parameter
    useEffect(() => {
        if (urlDate) {
            try {
                const [year, month, day] = urlDate.split('-').map(Number);
                const newDate = new Date(year, month - 1, day);

                if (!isNaN(newDate.getTime())) {
                    onDateSelect(newDate);
                }
            } catch (error) {
                console.error('Invalid date in URL:', urlDate);
                navigate('/');
            }
        }
    }, [urlDate, onDateSelect, navigate]);

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
            const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

            const weekday = weekdays[date.getDay()];
            const month = months[date.getMonth()];
            const day = date.getDate();

            return `${weekday}, ${month} ${day}`;
        }
    };

    const changeDate = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + offset);

        const dateString = formatDateForURL(newDate);
        navigate(`/${dateString}`);
        onDateSelect(newDate);
    };

    const getGamesForSelectedDate = () => {
        if (!games.length) return [];

        const selectedDateString = formatDateForURL(selectedDate);

        const gamesForDate = games.filter(game => {
            return game.game_date === selectedDateString;
        });

        console.log('Games for date:', selectedDateString, 'found:', gamesForDate.length);
        return gamesForDate;
    };

    const gamesForSelectedDate = getGamesForSelectedDate();

    if (loading) {
        return (
            <div className="p-4 w-screen border-white border-4 flex justify-center">
                <div className="text-white text-center py-4">Loading NBA games from API...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 w-screen border-white border-4 flex justify-center">
                <div className="text-white text-center py-4">
                    {error}
                    <br />
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

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
                        className="hover:text-[#9f9f9f] flex flex-row justify-center items-center w-60"
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
            <div className="p-4 w-screen border-white border-4 flex justify-center">
                <div className="w-1/2 flex flex-col space-y-2">
                    {gamesForSelectedDate.length === 0 ? (
                        <div className="text-white text-center py-4">
                            No NBA games found for {selectedDate.toLocaleDateString()}
                        </div>
                    ) : (
                        gamesForSelectedDate.map((game) => (
                            <button
                                key={game.game_id}
                                className="border-red-600 border-2 flex justify-center items-center h-10 hover:bg-[#393939] bg-[#1d1d1d] gap-4 px-4 w-full"
                                onClick={() => {
                                    const dateString = formatDateForURL(selectedDate);
                                    navigate(`/${dateString}/game/${game.game_id}`, {
                                        state: {
                                            game: game,
                                            home_team: {
                                                team_id: game.home_team_id,
                                                points: game.home_team_score
                                            },
                                            away_team: {
                                                team_id: game.away_team_id,
                                                points: game.away_team_score
                                            }
                                        }
                                    });
                                }}
                            >
                                {/* Away Team */}
                                <div className="flex items-center justify-end flex-1">
                                    <p className="mr-2 text-white">{getTeamName(game.away_team_id)}</p>
                                    <img
                                        src={getTeamLogoUrl(game.away_team_id)}
                                        alt={game.away_team_id.toString()}
                                        className="w-8 h-8"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>

                                {/* Scores - Centered */}
                                <div className="flex items-center gap-2 mx-4">
                                    <p className="text-white">{game.away_team_score}</p>
                                    <span className="text-gray-400">-</span>
                                    <p className="text-white">{game.home_team_score}</p>
                                </div>

                                {/* Home Team */}
                                <div className="flex items-center justify-start flex-1">
                                    <img
                                        src={getTeamLogoUrl(game.home_team_id)}
                                        alt={game.home_team_id.toString()}
                                        className="w-8 h-8 mr-2"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <p className="text-white">{getTeamName(game.home_team_id)}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export default Main;