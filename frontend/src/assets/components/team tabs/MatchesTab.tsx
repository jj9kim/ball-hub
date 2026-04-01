import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamName } from '../../../utils/teamMappings';
import { NBAService, type NBAGame, type FullScheduleGame } from '../../../api/nbaService';

interface MatchesTabProps {
    teamId?: number;
}

type ViewMode = 'date' | 'team';

interface Team {
    id: number;
    name: string;
    abbreviation: string;
}

function MatchesTab({ teamId: initialTeamId }: MatchesTabProps) {
    const [games, setGames] = useState<NBAGame[]>([]);
    const [futureGames, setFutureGames] = useState<FullScheduleGame[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [futureLoading, setFutureLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('date');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(initialTeamId || null);
    const [teams, setTeams] = useState<Team[]>([]);
    const navigate = useNavigate();

    const formatDateForURL = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatGameTime = (timeStr: string | undefined): string => {
        if (!timeStr) return 'TBD';
        try {
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return 'TBD';
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            const minuteStr = minutes.toString().padStart(2, '0');
            return `${hour12}:${minuteStr} ${ampm}`;
        } catch {
            return 'TBD';
        }
    };

    // Fetch teams list
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/standings/simple');
                const data = await response.json();
                if (data.success && data.standings) {
                    const teamList = data.standings.map((team: any) => ({
                        id: team.team_id,
                        name: team.team_name,
                        abbreviation: team.team_abbreviation || team.team_name.substring(0, 3)
                    })).sort((a: Team, b: Team) => a.name.localeCompare(b.name));
                    setTeams(teamList);
                }
            } catch (err) {
                console.error('Error fetching teams:', err);
            }
        };
        fetchTeams();
    }, []);

    // Fetch past games
    useEffect(() => {
        const loadGames = async () => {
            try {
                setLoading(true);
                const data = await NBAService.fetchGames();
                setGames(data.games);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load games');
            } finally {
                setLoading(false);
            }
        };
        loadGames();
    }, []);

    // Fetch future games
    useEffect(() => {
        const loadFutureGames = async () => {
            try {
                setFutureLoading(true);
                const data = await NBAService.fetchFullSchedule();
                const future = data.games.filter(game => game.gameStatus === 1);
                setFutureGames(future);
            } catch (err) {
                console.error('Error loading future games:', err);
            } finally {
                setFutureLoading(false);
            }
        };
        loadFutureGames();
    }, []);

    const getFormattedSelectedDate = (): string => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getPastGamesForSelectedDate = () => {
        if (!games.length) return [];
        const selectedDateStr = getFormattedSelectedDate();
        return games.filter(game => game.game_date === selectedDateStr);
    };

    // Get future games for selected date - SORTED BY TIME
    const getFutureGamesForSelectedDate = () => {
        if (!futureGames.length) return [];
        const selectedDateStr = getFormattedSelectedDate();
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(0, 0, 0, 0);
        const selectedDateISO = selectedDateObj.toISOString().split('T')[0];

        const filteredGames = futureGames.filter(game => {
            const gameDateStr = game.gameDate || game.gameDateEst;
            if (!gameDateStr) return false;
            const exactMatch = gameDateStr === selectedDateStr || gameDateStr === selectedDateISO;
            const gameDate = new Date(gameDateStr);
            gameDate.setHours(0, 0, 0, 0);
            const dateMatch = gameDate.getTime() === selectedDateObj.getTime();
            return exactMatch || dateMatch;
        });

        // Sort future games by time (earliest first)
        return filteredGames.sort((a, b) => {
            const timeA = a.gameTimeEst || '';
            const timeB = b.gameTimeEst || '';

            const parseTime = (timeStr: string): number => {
                if (!timeStr) return 0;
                try {
                    const date = new Date(timeStr);
                    return date.getTime();
                } catch {
                    return 0;
                }
            };

            return parseTime(timeA) - parseTime(timeB);
        });
    };

    const getTeamGames = () => {
        if (!selectedTeamId) return [];

        const pastTeamGames = games.filter(game =>
            game.teams.some(team => team.team_id === selectedTeamId)
        ).map(game => ({
            ...game,
            type: 'past' as const
        }));

        const futureTeamGames = futureGames.filter(game =>
            game.homeTeam_teamId === selectedTeamId || game.awayTeam_teamId === selectedTeamId
        ).map(game => ({
            ...game,
            type: 'future' as const
        }));

        // Sort all games by date (most recent first), and for future games, sort by time within same date
        return [...pastTeamGames, ...futureTeamGames].sort((a, b) => {
            const dateA = a.type === 'past'
                ? (a as NBAGame).game_date
                : (a as FullScheduleGame).gameDate || (a as FullScheduleGame).gameDateEst;
            const dateB = b.type === 'past'
                ? (b as NBAGame).game_date
                : (b as FullScheduleGame).gameDate || (b as FullScheduleGame).gameDateEst;

            const dateObjA = new Date(dateA);
            const dateObjB = new Date(dateB);

            // If same date, sort by time for future games
            if (dateObjA.toDateString() === dateObjB.toDateString()) {
                const timeA = a.type === 'future' ? (a as FullScheduleGame).gameTimeEst : null;
                const timeB = b.type === 'future' ? (b as FullScheduleGame).gameTimeEst : null;

                if (timeA && timeB) {
                    const timeValueA = new Date(timeA).getTime();
                    const timeValueB = new Date(timeB).getTime();
                    return timeValueA - timeValueB;
                }
                // Past games come first (no time), then future games by time
                if (a.type === 'past' && b.type === 'future') return -1;
                if (a.type === 'future' && b.type === 'past') return 1;
                return 0;
            }

            return dateObjB.getTime() - dateObjA.getTime();
        });
    };

    const changeDate = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + offset);
        setSelectedDate(newDate);
    };

    const getDateDisplayText = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        if (compareDate.getTime() === today.getTime()) return "Today";

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (compareDate.getTime() === yesterday.getTime()) return "Yesterday";

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (compareDate.getTime() === tomorrow.getTime()) return "Tomorrow";

        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    };

    const renderDateView = () => {
        const pastGamesForDate = getPastGamesForSelectedDate();
        const futureGamesForDate = getFutureGamesForSelectedDate();
        const allGamesForDate = [
            ...pastGamesForDate.map(game => ({ type: 'past' as const, data: game })),
            ...futureGamesForDate.map(game => ({ type: 'future' as const, data: game }))
        ];

        if (allGamesForDate.length === 0) {
            return (
                <div className="text-white text-center py-4">
                    No games found for {selectedDate.toLocaleDateString()}
                </div>
            );
        }

        return allGamesForDate.map((item, idx) => {
            if (item.type === 'past') {
                const game = item.data as NBAGame;
                if (game.teams.length !== 2) return null;
                const [team1, team2] = game.teams;

                return (
                    <button
                        key={`past-${game.game_id}`}
                        className="border-red-600 border-2 flex justify-center items-center h-12 hover:bg-[#393939] bg-[#1d1d1d] gap-4 px-4 w-full rounded-lg"
                        onClick={() => navigate(`/${formatDateForURL(selectedDate)}/game/${game.game_id}`)}
                    >
                        <div className="flex items-center justify-end flex-1">
                            <p className="mr-2 text-white text-sm">{getTeamName(team1.team_id)}</p>
                            <img src={`http://127.0.0.1:5000/api/team-logo/${team1.team_id}`} alt={team1.team_name} className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2 mx-4">
                            <p className="text-white">{team1.pts}</p>
                            <span className="text-gray-400">-</span>
                            <p className="text-white">{team2.pts}</p>
                        </div>
                        <div className="flex items-center justify-start flex-1">
                            <img src={`http://127.0.0.1:5000/api/team-logo/${team2.team_id}`} alt={team2.team_name} className="w-5 h-5 mr-2" />
                            <p className="text-white text-sm">{getTeamName(team2.team_id)}</p>
                        </div>
                    </button>
                );
            } else {
                const game = item.data as FullScheduleGame;
                return (
                    <button
                        key={`future-${game.gameId}`}
                        className="border-2 border-red-600 flex justify-center items-center h-12 hover:bg-[#393939] bg-[#1d1d1d] gap-4 px-4 w-full rounded-lg"
                        onClick={() => navigate(`/${formatDateForURL(selectedDate)}/game/${game.gameId}`)}
                    >
                        <div className="flex items-center justify-end flex-1">
                            <img src={`http://127.0.0.1:5000/api/team-logo/${game.homeTeam_teamId}`} alt={game.homeTeam_teamName} className="w-5 h-5 mr-2" />
                            <p className="text-white text-sm">{game.homeTeam_teamName}</p>
                        </div>
                        <div className="flex items-center gap-2 mx-4 min-w-[70px] justify-center">
                            <p className="text-[#9f9f9f] text-sm font-semibold">{formatGameTime(game.gameTimeEst)}</p>
                        </div>
                        <div className="flex items-center justify-start flex-1">
                            <p className="mr-2 text-white text-sm">{game.awayTeam_teamName}</p>
                            <img src={`http://127.0.0.1:5000/api/team-logo/${game.awayTeam_teamId}`} alt={game.awayTeam_teamName} className="w-5 h-5" />
                        </div>
                    </button>
                );
            }
        });
    };

    const renderTeamView = () => {
        if (!selectedTeamId) {
            return (
                <div className="text-white text-center py-4">
                    Please select a team from the dropdown
                </div>
            );
        }

        const teamGames = getTeamGames();

        if (teamGames.length === 0) {
            return (
                <div className="text-white text-center py-4">
                    No games found for this team
                </div>
            );
        }

        const selectedTeam = teams.find(t => t.id === selectedTeamId);
        const teamName = selectedTeam?.name || 'Team';

        return (
            <>
                <div className="text-white text-sm mb-3">
                    Showing games for: <span className="font-bold text-yellow-500">{teamName}</span>
                </div>
                <div className="flex flex-col space-y-2">
                    {teamGames.map((item, idx) => {
                        if (item.type === 'past') {
                            const game = item as NBAGame;
                            if (game.teams.length !== 2) return null;
                            const isHome = game.teams[0].team_id === selectedTeamId;
                            const ourTeam = isHome ? game.teams[0] : game.teams[1];
                            const opponent = isHome ? game.teams[1] : game.teams[0];
                            const gameDate = new Date(game.game_date);
                            const formattedDate = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                            return (
                                <button
                                    key={`past-${game.game_id}`}
                                    className="border-red-600 border-2 flex justify-between items-center h-12 hover:bg-[#393939] bg-[#1d1d1d] px-4 w-full rounded-lg"
                                    onClick={() => navigate(`/${game.game_date}/game/${game.game_id}`)}
                                >
                                    <div className="flex items-center gap-2">
                                        <img src={`http://127.0.0.1:5000/api/team-logo/${opponent.team_id}`} alt={opponent.team_name} className="w-5 h-5" />
                                        <span className="text-white text-sm">{opponent.team_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs">{formattedDate}</span>
                                        <span className={`font-bold ${ourTeam.pts > opponent.pts ? 'text-green-400' : 'text-red-400'}`}>
                                            {ourTeam.pts} - {opponent.pts}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{isHome ? 'HOME' : 'AWAY'}</div>
                                </button>
                            );
                        } else {
                            const game = item as FullScheduleGame;
                            const isHome = game.homeTeam_teamId === selectedTeamId;
                            const opponent = isHome ? game.awayTeam_teamName : game.homeTeam_teamName;
                            const opponentId = isHome ? game.awayTeam_teamId : game.homeTeam_teamId;
                            const gameDate = new Date(game.gameDate || game.gameDateEst);
                            const formattedDate = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const cleanDate = (game.gameDate || game.gameDateEst)?.split('T')[0];

                            return (
                                <button
                                    key={`future-${game.gameId}`}
                                    className="border-2 border-red-600 flex justify-between items-center h-12 hover:bg-[#393939] bg-[#1d1d1d] px-4 w-full rounded-lg"
                                    onClick={() => navigate(`/${cleanDate}/game/${game.gameId}`)}
                                >
                                    <div className="flex items-center gap-2">
                                        <img src={`http://127.0.0.1:5000/api/team-logo/${opponentId}`} alt={opponent} className="w-5 h-5" />
                                        <span className="text-white text-sm">{opponent}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs">{formattedDate}</span>
                                        <span className="text-yellow-500 text-xs font-semibold">{formatGameTime(game.gameTimeEst)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">{isHome ? 'HOME' : 'AWAY'}</div>
                                </button>
                            );
                        }
                    })}
                </div>
            </>
        );
    };

    if (loading && !games.length) {
        return (
            <div className="w-full text-white border-2 border-green-400 bg-[#1d1d1d] rounded-2xl p-4 min-h-[400px]">
                <div className="text-center py-8">Loading games...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full text-white border-2 border-green-400 bg-[#1d1d1d] rounded-2xl p-4 min-h-[400px]">
                <div className="text-red-400 text-center py-4">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="w-full text-white border-2 border-green-400 bg-[#1d1d1d] rounded-2xl p-4 min-h-[500px] overflow-hidden">
            {/* View Toggle Buttons */}
            <div className="flex mb-6 space-x-4">
                <button
                    className={`px-4 py-2 rounded-3xl font-medium text-sm transition ${viewMode === 'date'
                            ? 'bg-white text-black'
                            : 'bg-[#333333] text-white hover:bg-[#444444]'
                        }`}
                    onClick={() => setViewMode('date')}
                >
                    By Date
                </button>
                <button
                    className={`px-4 py-2 rounded-3xl font-medium text-sm transition ${viewMode === 'team'
                            ? 'bg-white text-black'
                            : 'bg-[#333333] text-white hover:bg-[#444444]'
                        }`}
                    onClick={() => setViewMode('team')}
                >
                    By Team
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px] max-h-[450px] overflow-y-auto">
                {viewMode === 'date' ? (
                    <>
                        <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1d1d1d] py-2 z-10">
                            <button
                                onClick={() => changeDate(-1)}
                                className="text-white hover:text-gray-400 text-xl font-bold px-3 py-1 transition"
                            >
                                &lt;
                            </button>
                            <button className="text-white font-medium">
                                {getDateDisplayText(selectedDate)}
                            </button>
                            <button
                                onClick={() => changeDate(1)}
                                className="text-white hover:text-gray-400 text-xl font-bold px-3 py-1 transition"
                            >
                                &gt;
                            </button>
                        </div>
                        <div className="flex flex-col space-y-2">
                            {renderDateView()}
                        </div>
                        {futureLoading && (
                            <div className="text-gray-400 text-center py-2 text-sm mt-2">
                                Loading future games...
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                            <select
                                value={selectedTeamId || ''}
                                onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-[#333333] text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">Select a team...</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {renderTeamView()}
                    </>
                )}
            </div>
        </div>
    );
}

export default MatchesTab;