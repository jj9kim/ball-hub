import React, { useEffect, useState } from "react";
import { getTeamName } from '../utils/teamMappings';
import { useParams, useNavigate } from 'react-router-dom';
import { NBAService, type NBAAPIResponse, type NBAGame, type NBATeamStats } from '../api/nbaService';

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

function Main({ isCalendarOpen, onOpenCalendar, selectedDate, onDateSelect }: MainProps) {
    const [games, setGames] = useState<NBAGame[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { date: urlDate } = useParams<{ date?: string }>();
    const navigate = useNavigate();

    // Fetch games from API
    useEffect(() => {
        const loadGames = async () => {
            try {
                setLoading(true);
                const data = await NBAService.fetchGames();
                setGames(data.games);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load games');
                console.error('Error loading games:', err);
            } finally {
                setLoading(false);
            }
        };

        loadGames();
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

        // Use local date string instead of ISO string
        const dateString = formatDateForURL(newDate);
        navigate(`/${dateString}`);
        onDateSelect(newDate);
    };

    const getGamesForSelectedDate = () => {
        if (!games.length) return [];

        const selectedGames = games.filter(game => {
            const [year, month, day] = game.game_date.split('-').map(Number);
            const gameDate = new Date(year, month - 1, day);

            // Compare dates without time components
            const compareSelectedDate = new Date(selectedDate);
            compareSelectedDate.setHours(0, 0, 0, 0);
            gameDate.setHours(0, 0, 0, 0);

            return gameDate.getTime() === compareSelectedDate.getTime();
        });

        // Sort by game_id in ascending order
        selectedGames.sort((a, b) => {
            // Convert string IDs to numbers for proper numeric sorting
            const idA = parseInt(a.game_id);
            const idB = parseInt(b.game_id);
            return idA - idB; // Ascending order
        });

        console.log('Games for date:', selectedDate, 'found:', selectedGames.length);
        return selectedGames;
    };

    const gamesForSelectedDate = getGamesForSelectedDate();

    if (loading) {
        return (
            <div className="text-white text-center py-8">
                Loading NBA games...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-white text-center py-8">
                Error: {error}
                <button
                    onClick={() => window.location.reload()}
                    className="ml-4 px-4 py-2 bg-red-600 rounded"
                >
                    Retry
                </button>
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
                            No games found for {selectedDate.toLocaleDateString()}
                        </div>
                    ) : (
                        gamesForSelectedDate.map((game) => {
                            // Each game should have exactly 2 teams
                            if (game.teams.length !== 2) {
                                console.log('Incomplete game data for game:', game.game_id);
                                return null;
                            }

                            const [team1, team2] = game.teams;

                            return (
                                <button
                                    key={game.game_id}
                                    className="border-red-600 border-2 flex justify-center items-center h-10 hover:bg-[#393939] bg-[#1d1d1d] gap-4 px-4 w-full"
                                    onClick={() => {
                                        const dateString = formatDateForURL(selectedDate);
                                        navigate(`/${dateString}/game/${game.game_id}`, {
                                            state: {
                                                game: game,
                                                teams: [team1, team2]
                                            }
                                        });
                                    }}
                                >
                                    {/* Team 1 */}
                                    <div className="flex items-center justify-end flex-1">
                                        <p className="mr-2 text-white">{getTeamName(team1.team_id)}</p>
                                        <img
                                            src={`http://127.0.0.1:5000/api/team-logo/${team1.team_id}`}
                                            alt={team1.team_name}
                                            className="w-5 h-5"
                                            onError={(e) => {
                                                // Fallback: Show team abbreviation
                                                const teamWords = team1.team_name.split(' ');
                                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                            <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                            </div>
                                            <span>${team1.team_name}</span>
                                        `;
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Scores - Centered */}
                                    <div className="flex items-center gap-2 mx-4">
                                        <p className="text-white">{team1.pts}</p>
                                        <span className="text-gray-400">-</span>
                                        <p className="text-white">{team2.pts}</p>
                                    </div>

                                    {/* Team 2 */}
                                    <div className="flex items-center justify-start flex-1">
                                        <img
                                            src={`http://127.0.0.1:5000/api/team-logo/${team2.team_id}`}
                                            alt={team2.team_name}
                                            className="w-5 h-5 mr-2"
                                            onError={(e) => {
                                                // Fallback: Show team abbreviation
                                                const teamWords = team2.team_name.split(' ');
                                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                            <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                            </div>
                                            <span>${team2.team_name}</span>
                                        `;
                                                }
                                            }}
                                        />
                                        <p className="text-white">{getTeamName(team2.team_id)}</p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export default Main;