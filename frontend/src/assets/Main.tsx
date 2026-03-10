import React, { useEffect, useState } from "react";
import { getTeamName } from '../utils/teamMappings';
import { useParams, useNavigate } from 'react-router-dom';
import { NBAService, type NBAGame, type FullScheduleGame } from '../api/nbaService';

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
    const [futureGames, setFutureGames] = useState<FullScheduleGame[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [futureLoading, setFutureLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { date: urlDate } = useParams<{ date?: string }>();
    const navigate = useNavigate();

    // Add this useEffect to see all future game dates
    useEffect(() => {
        if (futureGames.length > 0) {
            const uniqueDates = [...new Set(futureGames.map(game => game.gameDate || game.gameDateEst))];
            console.log('All future game dates in data:', uniqueDates.sort());

            // Show first few games with their dates
            console.log('Sample future games:');
            futureGames.slice(0, 5).forEach(game => {
                console.log({
                    date: game.gameDate || game.gameDateEst,
                    gameId: game.gameId,
                    away: game.awayTeam_teamName,
                    home: game.homeTeam_teamName
                });
            });
        }
    }, [futureGames]);

    // Fetch past games from API
    useEffect(() => {
        const loadGames = async () => {
            try {
                setLoading(true);
                const data = await NBAService.fetchGames();
                setGames(data.games);
                console.log('Past games loaded:', data.games.length);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load games');
                console.error('Error loading games:', err);
            } finally {
                setLoading(false);
            }
        };

        loadGames();
    }, []);

    // Fetch future games separately
    useEffect(() => {
        const loadFutureGames = async () => {
            try {
                setFutureLoading(true);
                const data = await NBAService.fetchFullSchedule();
                console.log('Full schedule data received. Total games:', data.games.length);

                // Log status distribution
                const statusCounts: Record<number, number> = {};
                data.games.forEach(game => {
                    statusCounts[game.gameStatus] = (statusCounts[game.gameStatus] || 0) + 1;
                });
                console.log('Game status distribution:', statusCounts);

                // Try without filtering first to see what we get
                console.log('All games sample (first 3):', data.games.slice(0, 3));

                // Filter only future games (gameStatus === 1)
                const future = data.games.filter(game => {
                    const isFuture = game.gameStatus === 1;
                    return isFuture;
                });

                setFutureGames(future);
                console.log('Future games after filter:', future.length);

                // If no future games with status 1, try status 2 or just any game with future date
                if (future.length === 0) {
                    console.log('No games with status 1. Checking by date...');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const futureByDate = data.games.filter(game => {
                        const gameDateStr = game.gameDate || game.gameDateEst;
                        if (!gameDateStr) return false;

                        const gameDate = new Date(gameDateStr);
                        gameDate.setHours(0, 0, 0, 0);

                        return gameDate >= today;
                    });

                    console.log('Games with future dates:', futureByDate.length);
                    if (futureByDate.length > 0) {
                        setFutureGames(futureByDate);
                    }
                }

            } catch (err) {
                console.error('Error loading future games:', err);
            } finally {
                setFutureLoading(false);
            }
        };

        loadFutureGames();
    }, []);

    // Fetch future games separately
    useEffect(() => {
        const loadFutureGames = async () => {
            try {
                setFutureLoading(true);
                const data = await NBAService.fetchFullSchedule();
                console.log('Full schedule data:', data);

                // Log the first game to see its structure
                if (data.games.length > 0) {
                    console.log('First game sample:', data.games[0]);
                }

                // Filter only future games (gameStatus === 1)
                const future = data.games.filter(game => {
                    const isFuture = game.gameStatus === 1;
                    if (isFuture) {
                        console.log('Future game found:', game.gameDate, game.gameId, game.awayTeam_teamName, '@', game.homeTeam_teamName);
                    }
                    return isFuture;
                });

                setFutureGames(future);
                console.log('Future games loaded:', future.length);
            } catch (err) {
                console.error('Error loading future games:', err);
            } finally {
                setFutureLoading(false);
            }
        };

        loadFutureGames();
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

    // Format selected date as YYYY-MM-DD
    const getFormattedSelectedDate = (): string => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get past games for selected date
    const getPastGamesForSelectedDate = () => {
        if (!games.length) return [];

        const selectedDateStr = getFormattedSelectedDate();

        const selectedGames = games.filter(game => {
            return game.game_date === selectedDateStr;
        });

        selectedGames.sort((a, b) => {
            const idA = parseInt(a.game_id);
            const idB = parseInt(b.game_id);
            return idA - idB;
        });

        return selectedGames;
    };

    // Get future games for selected date
    // Get future games for selected date
    const getFutureGamesForSelectedDate = () => {
        if (!futureGames.length) return [];

        const selectedDateStr = getFormattedSelectedDate();

        // Try different date formats for matching
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(0, 0, 0, 0);

        const selectedDateISO = selectedDateObj.toISOString().split('T')[0]; // YYYY-MM-DD

        console.log('Looking for games on:', {
            formatted: selectedDateStr,
            iso: selectedDateISO,
            original: selectedDate
        });

        const selectedFutureGames = futureGames.filter(game => {
            const gameDateStr = game.gameDate || game.gameDateEst;

            if (!gameDateStr) return false;

            // Try multiple comparison methods
            const exactMatch = gameDateStr === selectedDateStr || gameDateStr === selectedDateISO;

            // Try parsing both as Date objects
            const gameDate = new Date(gameDateStr);
            gameDate.setHours(0, 0, 0, 0);

            const dateMatch = gameDate.getTime() === selectedDateObj.getTime();

            if (exactMatch || dateMatch) {
                console.log('Match found:', gameDateStr, 'for date', selectedDateStr);
                return true;
            }

            return false;
        });

        console.log(`Future games for ${selectedDateStr}:`, selectedFutureGames.length);
        return selectedFutureGames;
    };

    const pastGamesForDate = getPastGamesForSelectedDate();
    const futureGamesForDate = getFutureGamesForSelectedDate();

    // Combine both types of games
    const allGamesForDate = [
        ...pastGamesForDate.map(game => ({ type: 'past' as const, data: game })),
        ...futureGamesForDate.map(game => ({ type: 'future' as const, data: game }))
    ];

    

    // Log what we're showing
    useEffect(() => {
        console.log('Selected date:', getFormattedSelectedDate());
        console.log('Past games for date:', pastGamesForDate.length);
        console.log('Future games for date:', futureGamesForDate.length);
        console.log('Total games to display:', allGamesForDate.length);
    }, [selectedDate, pastGamesForDate, futureGamesForDate]);

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

            {/* Games list - Combined past and future */}
            <div className="p-4 w-screen border-white border-4 flex justify-center">
                <div className="w-1/2 flex flex-col space-y-2">
                    {allGamesForDate.length === 0 ? (
                        <div className="text-white text-center py-4">
                            No games found for {selectedDate.toLocaleDateString()}
                        </div>
                    ) : (
                        allGamesForDate.map((item, index) => {
                            if (item.type === 'past') {
                                // Past game format
                                const game = item.data as NBAGame;
                                if (game.teams.length !== 2) {
                                    console.log('Incomplete game data for game:', game.game_id);
                                    return null;
                                }

                                const [team1, team2] = game.teams;

                                return (
                                    <button
                                        key={`past-${game.game_id}`}
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
                            } else {
                                // Future game format - matching past game style
                                const game = item.data as FullScheduleGame;

                                // Helper function to format time from ISO string, preserving the original hour
                                const formatGameTime = (timeStr: string | undefined): string => {
                                    if (!timeStr) return 'TBD';

                                    try {
                                        // Parse the ISO string
                                        const date = new Date(timeStr);

                                        // Check if valid date
                                        if (isNaN(date.getTime())) return 'TBD';

                                        // Get UTC hours and minutes directly to avoid timezone conversion
                                        const hours = date.getUTCHours();
                                        const minutes = date.getUTCMinutes();

                                        // Convert to 12-hour format
                                        const ampm = hours >= 12 ? 'PM' : 'AM';
                                        const hour12 = hours % 12 || 12;
                                        const minuteStr = minutes.toString().padStart(2, '0');

                                        return `${hour12}:${minuteStr} ${ampm}`;
                                    } catch (error) {
                                        return 'TBD';
                                    }
                                };

                                return (
                                    <button
                                        key={`future-${game.gameId}`}
                                        className="border-2 border-red-600 flex justify-center items-center h-10 hover:bg-[#393939] bg-[#1d1d1d] gap-4 px-4 w-full"
                                        onClick={() => {
                                            const dateString = formatDateForURL(selectedDate);
                                            navigate(`/${dateString}/game/${game.gameId}`, {
                                                state: {
                                                    game: game,
                                                    isFuture: true
                                                }
                                            });
                                        }}
                                    >
                                        {/* Home Team */}
                                        <div className="flex items-center justify-end flex-1">
                                            <img
                                                src={`http://127.0.0.1:5000/api/team-logo/${game.homeTeam_teamId}`}
                                                alt={game.homeTeam_teamName}
                                                className="w-5 h-5 mr-2"
                                                onError={(e) => {
                                                    const teamWords = game.homeTeam_teamName.split(' ');
                                                    const teamAbbreviation = teamWords[teamWords.length - 1];
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `
                            <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                            </div>
                            <span>${game.homeTeam_teamName}</span>
                        `;
                                                    }
                                                }}
                                            />
                                            <p className="text-white">{game.homeTeam_teamName}</p>
                                        </div>

                                        {/* Game Time - Centered */}
                                        <div className="flex items-center gap-2 mx-4 min-w-[70px] justify-center">
                                            <p className="text-[#9f9f9f] text-sm font-semibold">
                                                {formatGameTime(game.gameTimeEst)}
                                            </p>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center justify-start flex-1">
                                            <p className="mr-2 text-white">{game.awayTeam_teamName}</p>
                                            <img
                                                src={`http://127.0.0.1:5000/api/team-logo/${game.awayTeam_teamId}`}
                                                alt={game.awayTeam_teamName}
                                                className="w-5 h-5"
                                                onError={(e) => {
                                                    const teamWords = game.awayTeam_teamName.split(' ');
                                                    const teamAbbreviation = teamWords[teamWords.length - 1];
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `
                            <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                            </div>
                            <span>${game.awayTeam_teamName}</span>
                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                    </button>
                                );
                            }
                        })
                    )}

                    {/* Show loading indicator for future games if needed */}
                    {futureLoading && (
                        <div className="text-gray-400 text-center py-2 text-sm">
                            Loading future games...
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export default Main;