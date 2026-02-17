// assets/components/teamprofile/tabs/TeamOverviewTab.tsx
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

interface TeamOverviewTabProps {
    teamInfo: {
        team_id: number;
        team_name: string;
        team_city: string;
        full_name: string;
    };
    roster: {
        players: any[];
        coaches: any[];
        player_count: number;
        coach_count: number;
    } | null;
}

interface TeamStanding {
    team_id: number;
    team_name: string;
    team_city: string;
    team_conference: string;
    team_division: string;
    wins: number;
    losses: number;
    win_pct: number;
    conference_rank: number;
    division_rank: number;
    games_back: number; // Conference games back
    streak: string;
    record: string;
    home_record: string;
    away_record: string;
    last_10_record: string;
    points_per_game: number;
    opp_points_per_game: number;
    point_differential: number;
}

interface StandingsData {
    success: boolean;
    season: string;
    standings: TeamStanding[];
}

interface TeamStandingWithGB extends TeamStanding {
    overall_games_back: number;
    division_games_back: number;
}

interface GameFormData {
    game_id: string;
    game_date: string;
    opponent: string;
    opponent_id: number;
    result: string;
    points_for: number;
    points_against: number;
    is_home: boolean;
    home_score: number;  // Add this
    away_score: number;  // Add this
    matchup: string;
}

export default function TeamOverviewTab({ teamInfo }: TeamOverviewTabProps) {
    const [standings, setStandings] = useState<TeamStandingWithGB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastGameStarters, setLastGameStarters] = useState<any[]>([]);
    const [startersLoading, setStartersLoading] = useState(true);
    const [startersError, setStartersError] = useState<string | null>(null);
    const [teamForm, setTeamForm] = useState<any[]>([]);
    const [formLoading, setFormLoading] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);

        // Also scroll to top when playerId changes
        return () => {
            // Optional: Cleanup if needed
        };
    });

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://127.0.0.1:5000/api/standings/simple');
            const data: StandingsData = await response.json();

            if (data.success && data.standings) {
                const standingsWithGB = calculateAllGamesBack(data.standings);
                setStandings(standingsWithGB);
            } else {
                setError(data.success === false ? 'Failed to load standings' : 'No standings data');
            }
        } catch (err) {
            console.error('Error fetching standings:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch standings');
        } finally {
            setLoading(false);
        }
    };

    const fetchLastGameStarters = async () => {
        try {
            setStartersLoading(true);

            // First, get the last game for this team
            const gamesResponse = await fetch('http://127.0.0.1:5000/api/nba-games');
            const gamesData = await gamesResponse.json();

            if (!gamesData.success) {
                throw new Error('Failed to fetch games');
            }

            // Find the most recent game for this team
            const teamGames = gamesData.games
                .filter((game: any) =>
                    game.teams.some((team: any) => team.team_id === teamInfo.team_id)
                )
                .sort((a: any, b: any) => b.game_date.localeCompare(a.game_date));

            if (teamGames.length === 0) {
                setStartersError('No games found for this team');
                setStartersLoading(false);
                return;
            }

            const lastGame = teamGames[0];
            const gameId = lastGame.game_id;

            // Fetch the boxscore for that game
            const boxscoreResponse = await fetch(`http://127.0.0.1:5000/api/game/${gameId}/simple-boxscore`);
            const boxscoreData = await boxscoreResponse.json();

            if (!boxscoreData.success) {
                throw new Error('Failed to fetch boxscore');
            }

            // Get the team ID to filter players
            const teamId = teamInfo.team_id;

            // Filter starters for this team
            const starters = boxscoreData.players
                .filter((player: any) =>
                    player.team_id === teamId &&
                    player.starter === true
                )
                .map((player: any) => ({
                    ...player,
                    // Normalize position names
                    position: player.position?.toUpperCase().replace(/\s+/g, '') || ''
                }))
                .sort((a: any, b: any) => {
                    // Sort by position order: PG, SG, SF, PF, C
                    const positionOrder = ['PG', 'SG', 'SF', 'PF', 'C'];
                    return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
                });

            console.log('Last game starters:', starters);
            setLastGameStarters(starters);

        } catch (err) {
            console.error('Error fetching starters:', err);
            setStartersError(err instanceof Error ? err.message : 'Failed to fetch starters');
        } finally {
            setStartersLoading(false);
        }
    };

    useEffect(() => {
        fetchStandings();
        fetchLastGameStarters();
        fetchTeamForm();
    }, []);

    const fetchTeamForm = async () => {
        try {
            setFormLoading(true);

            const gamesResponse = await fetch('http://127.0.0.1:5000/api/nba-games');
            const gamesData = await gamesResponse.json();

            if (!gamesData.success) {
                throw new Error('Failed to fetch games');
            }

            const teamGames = gamesData.games
                .filter((game: any) =>
                    game.teams.some((team: any) => team.team_id === teamInfo.team_id)
                )
                .sort((a: any, b: any) => a.game_date.localeCompare(b.game_date))
                .slice(-5);

            const formattedGames = teamGames.map((game: any) => {
                // Find both teams
                const homeTeam = game.teams[0]; // First team is home
                const awayTeam = game.teams[1]; // Second team is away

                // Determine if our team is home or away
                const isHome = homeTeam?.team_id === teamInfo.team_id;

                // Get opponent
                const opponent = isHome ? awayTeam : homeTeam;

                // Get result (W/L) for our team
                const ourTeam = isHome ? homeTeam : awayTeam;

                return {
                    game_id: game.game_id,
                    game_date: game.game_date,
                    opponent: opponent?.team_name || 'Unknown',
                    opponent_id: opponent?.team_id,
                    result: ourTeam?.wl || 'N/A',
                    points_for: ourTeam?.pts || 0,
                    points_against: opponent?.pts || 0,
                    is_home: isHome,
                    // Store both home and away scores for proper display
                    home_score: homeTeam?.pts || 0,
                    away_score: awayTeam?.pts || 0,
                    matchup: game.matchup
                };
            });

            console.log('Team form games:', formattedGames);
            setTeamForm(formattedGames);

        } catch (err) {
            console.error('Error fetching team form:', err);
            setFormError(err instanceof Error ? err.message : 'Failed to fetch team form');
        } finally {
            setFormLoading(false);
        }
    };

    const calculateAllGamesBack = (standings: TeamStanding[]): TeamStandingWithGB[] => {
        const sorted = [...standings].sort((a, b) => b.win_pct - a.win_pct);

        // Find overall leader
        const overallLeader = sorted[0];

        // Find division leaders
        const divisionLeaders: Record<string, TeamStanding> = {};
        standings.forEach(team => {
            const division = team.team_division;
            if (!divisionLeaders[division] || team.win_pct > divisionLeaders[division].win_pct) {
                divisionLeaders[division] = team;
            }
        });

        return sorted.map(team => {
            // Calculate overall games back
            let overall_games_back = 0;
            if (team.team_id !== overallLeader.team_id) {
                overall_games_back = ((overallLeader.wins - team.wins) + (team.losses - overallLeader.losses)) / 2;
            }

            // Calculate division games back
            let division_games_back = 0;
            const divisionLeader = divisionLeaders[team.team_division];
            if (team.team_id !== divisionLeader.team_id) {
                division_games_back = ((divisionLeader.wins - team.wins) + (team.losses - divisionLeader.losses)) / 2;
            }

            return {
                ...team,
                overall_games_back,
                division_games_back
            };
        });
    };

    const getTeamLogo = (teamId: number) => {
        return `http://127.0.0.1:5000/api/team-logo/${teamId}`;
    };

    // Helper functions for standings
    const formatGamesBack = (gamesBack: number): string => {
        if (gamesBack === 0) return '-';
        return gamesBack.toFixed(1);
    };

    const getStreakColor = (streak: string) => {
        if (streak.startsWith('W')) {
            return 'text-green-400';
        } else if (streak.startsWith('L')) {
            return 'text-red-400';
        }
        return 'text-gray-400';
    };

    // Sort all teams by win percentage (league standings)
    const leagueStandings = [...standings].sort((a, b) => b.win_pct - a.win_pct);

    return (
        <div className="grid grid-cols-3 grid-rows-[21vh_10px] gap-4 h-200">
            {/* Top left - Team Form */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] h-40 overflow-hidden">
                <h2 className="ml-3 mt-3 text-white font-semibold">Team Form</h2>

                {formLoading ? (
                    <div className="flex items-center justify-center h-20">
                        <p className="text-gray-400 text-sm">Loading form...</p>
                    </div>
                ) : formError ? (
                    <div className="flex items-center justify-center h-20">
                        <p className="text-red-400 text-sm">{formError}</p>
                    </div>
                ) : teamForm.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                        <p className="text-gray-400 text-sm">No recent games</p>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-24 space-x-4 px-2">
                        {teamForm.map((game, index) => {
                            // Determine home and away scores from the game data
                            let homeScore, awayScore;

                            if (game.is_home) {
                                // Our team is home
                                homeScore = game.points_for;      // Our team's score (home)
                                awayScore = game.points_against;  // Opponent's score (away)
                            } else {
                                // Our team is away
                                homeScore = game.points_against;  // Opponent's score (home)
                                awayScore = game.points_for;       // Our team's score (away)
                            }

                            return (
                                <div
                                    key={index}
                                    onClick={() => navigate(`/game/${game.game_id}`)}
                                    className="flex flex-col items-center justify-center w-15 cursor-pointer hover:scale-110 transition"
                                    title={`${game.opponent} (${game.is_home ? 'Home' : 'Away'})`}
                                >
                                    {/* Score always shows as Home-Away */}
                                    <div className={`w-full text-center py-1 rounded-lg font-bold text-xs mb-1 ${game.result === 'W'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-red-500 text-white'
                                        }`}>
                                        {game.home_score}-{game.away_score}
                                    </div>

                                    {/* Team Logo - opponent's logo */}
                                    <div className="w-full flex justify-center pt-1">
                                        <img
                                            src={`http://127.0.0.1:5000/api/team-logo/${game.opponent_id}`}
                                            alt={game.opponent}
                                            className="w-8 h-8"
                                            onError={(e) => {
                                                const teamWords = game.opponent.split(' ');
                                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    // Create fallback div
                                                    const fallbackDiv = document.createElement('div');
                                                    fallbackDiv.className = 'w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center';
                                                    fallbackDiv.innerHTML = `<span class="text-xs font-bold text-white">${teamAbbreviation.substring(0, 2)}</span>`;
                                                    parent.appendChild(fallbackDiv);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Top middle */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] h-40">
                <h2 className="ml-3 mt-3 text-white">Next Match</h2>
            </div>
            {/* Right tall (spans both rows) */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] row-span-2 h-110">

                <div className="h-19 flex items-center flex-row-reverse px-4">
                    <h2 className="text-white mr-5">
                        {startersLoading ? 'Loading Starting 5...' : 'Last Starting 5'}
                    </h2>
                    <div className="text-white mr-25">Season Stats</div>
                    <img
                        src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7"
                        alt="NBA"
                        className="w-10 h-10 mr-2"
                    />
                </div>
                <div className="relative h-90 bg-[#1d1d1d] rounded-2xl">
                    <div className="relative h-full bg-[#2c2c2c] overflow-hidden rounded-b-2xl">
                        {/* Court Base */}
                        <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                        {/* Baseline */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#343434]"></div>

                        {/* Three-Point Line */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                            <div className="w-[360px] h-[280px] border-4 border-[#343434] rounded-b-full rounded-l-3xl border-t-0"></div>
                        </div>

                        {/* Key/Paint Area */}
                        <div className="absolute top-0 left-1/3 right-1/3 h-9/20 border-x-4 border-[#343434]"></div>

                        {/* Free Throw Line */}
                        <div className="absolute top-9/20 left-1/3 right-1/3 h-1 bg-[#343434]"></div>

                        {/* Free Throw Circle */}
                        <div className="absolute top-7/20 left-1/2 w-20 h-20 border-4 border-[#343434] rounded-full transform -translate-x-1/2"></div>

                        {/* Dynamic Starters - Player Cards */}
                        {startersLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-gray-400">Loading starters...</div>
                            </div>
                        ) : startersError ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-gray-500 text-sm">No starting lineup data</div>
                            </div>
                        ) : (
                            <>
                                {/* Point Guard */}
                                {lastGameStarters.find(p => p.position === 'PG') && (
                                    <div className="absolute top-90/100 left-51/100 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                                        onClick={() => {
                                            const player = lastGameStarters.find(p => p.position === 'PG');
                                            const playerName = encodeURIComponent(player.name);
                                            navigate(`/player/${player.player_id}/${playerName}`);
                                        }}>
                                        <div className="relative hover:opacity-50 w-30 h-30 flex flex-col items-center transition-opacity whitespace-nowrap">
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-amber-500">
                                                <img
                                                    src={`http://127.0.0.1:5000/api/nba-image/${lastGameStarters.find(p => p.position === 'PG')?.player_id}`}
                                                    alt={lastGameStarters.find(p => p.position === 'PG')?.name}
                                                    className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const initials = lastGameStarters.find(p => p.position === 'PG')?.name
                                                                .split(' ')
                                                                .map((n: string) => n[0])
                                                                .join('')
                                                                .toUpperCase()
                                                                .substring(0, 2);
                                                            parent.innerHTML = `
                                                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center border-2 border-amber-500">
                                                        <span class="text-xl font-bold text-white">${initials}</span>
                                                    </div>
                                                `;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className='flex flex-row justify-center mt-1'>
                                                <div className='text-[#ababab] text-[11px] pr-1'>
                                                    #{lastGameStarters.find(p => p.position === 'PG')?.jersey || ''}
                                                </div>
                                                <div className='text-white text-[11px]'>
                                                    {lastGameStarters.find(p => p.position === 'PG')?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Shooting Guard */}
                                {lastGameStarters.find(p => p.position === 'SG') && (
                                    <div className="absolute top-74/100 left-16/100 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="relative hover:opacity-50 w-30 h-30 flex flex-col items-center transition-opacity whitespace-nowrap cursor-pointer"
                                            onClick={() => {
                                                const player = lastGameStarters.find(p => p.position === 'SG');
                                                const playerName = encodeURIComponent(player.name);
                                                navigate(`/player/${player.player_id}/${playerName}`);
                                            }}>
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-amber-500">
                                                <img
                                                    src={`http://127.0.0.1:5000/api/nba-image/${lastGameStarters.find(p => p.position === 'SG')?.player_id}`}
                                                    alt={lastGameStarters.find(p => p.position === 'SG')?.name}
                                                    className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const initials = lastGameStarters.find(p => p.position === 'SG')?.name
                                                                .split(' ')
                                                                .map((n: string) => n[0])
                                                                .join('')
                                                                .toUpperCase()
                                                                .substring(0, 2);
                                                            parent.innerHTML = `
                                                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center border-2 border-amber-500">
                                                        <span class="text-xl font-bold text-white">${initials}</span>
                                                    </div>
                                                `;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className='flex flex-row justify-center mt-1'>
                                                <div className='text-[#ababab] text-[11px] pr-1'>
                                                    #{lastGameStarters.find(p => p.position === 'SG')?.jersey || ''}
                                                </div>
                                                <div className='text-white text-[11px]'>
                                                    {lastGameStarters.find(p => p.position === 'SG')?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Small Forward */}
                                {lastGameStarters.find(p => p.position === 'SF') && (
                                    <div className="absolute top-60/100 left-80/100 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="relative hover:opacity-50 w-30 h-30 flex flex-col items-center transition-opacity whitespace-nowrap cursor-pointer"
                                            onClick={() => {
                                                const player = lastGameStarters.find(p => p.position === 'SF');
                                                const playerName = encodeURIComponent(player.name);
                                                navigate(`/player/${player.player_id}/${playerName}`);
                                            }}>
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-amber-500">
                                                <img
                                                    src={`http://127.0.0.1:5000/api/nba-image/${lastGameStarters.find(p => p.position === 'SF')?.player_id}`}
                                                    alt={lastGameStarters.find(p => p.position === 'SF')?.name}
                                                    className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const initials = lastGameStarters.find(p => p.position === 'SF')?.name
                                                                .split(' ')
                                                                .map((n: string) => n[0])
                                                                .join('')
                                                                .toUpperCase()
                                                                .substring(0, 2);
                                                            parent.innerHTML = `
                                                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center border-2 border-amber-500">
                                                        <span class="text-xl font-bold text-white">${initials}</span>
                                                    </div>
                                                `;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className='flex flex-row justify-center mt-1'>
                                                <div className='text-[#ababab] text-[11px] pr-1'>
                                                    #{lastGameStarters.find(p => p.position === 'SF')?.jersey || ''}
                                                </div>
                                                <div className='text-white text-[11px]'>
                                                    {lastGameStarters.find(p => p.position === 'SF')?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Power Forward */}
                                {lastGameStarters.find(p => p.position === 'PF') && (
                                    <div className="absolute top-34/100 left-20/100 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="relative hover:opacity-50 w-30 h-30 flex flex-col items-center transition-opacity whitespace-nowrap cursor-pointer"
                                            onClick={() => {
                                                const player = lastGameStarters.find(p => p.position === 'PF');
                                                const playerName = encodeURIComponent(player.name);
                                                navigate(`/player/${player.player_id}/${playerName}`);
                                            }}>
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-amber-500">
                                                <img
                                                    src={`http://127.0.0.1:5000/api/nba-image/${lastGameStarters.find(p => p.position === 'PF')?.player_id}`}
                                                    alt={lastGameStarters.find(p => p.position === 'PF')?.name}
                                                    className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const initials = lastGameStarters.find(p => p.position === 'PF')?.name
                                                                .split(' ')
                                                                .map((n: string) => n[0])
                                                                .join('')
                                                                .toUpperCase()
                                                                .substring(0, 2);
                                                            parent.innerHTML = `
                                                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center border-2 border-amber-500">
                                                        <span class="text-xl font-bold text-white">${initials}</span>
                                                    </div>
                                                `;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className='flex flex-row justify-center mt-1'>
                                                <div className='text-[#ababab] text-[11px] pr-1'>
                                                    #{lastGameStarters.find(p => p.position === 'PF')?.jersey || ''}
                                                </div>
                                                <div className='text-white text-[11px]'>
                                                    {lastGameStarters.find(p => p.position === 'PF')?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Center */}
                                {lastGameStarters.find(p => p.position === 'C') && (
                                    <div className="absolute top-22/100 left-56/100 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="relative hover:opacity-50 w-30 h-30 flex flex-col items-center transition-opacity whitespace-nowrap cursor-pointer"
                                            onClick={() => {
                                                const player = lastGameStarters.find(p => p.position === 'C');
                                                const playerName = encodeURIComponent(player.name);
                                                navigate(`/player/${player.player_id}/${playerName}`);
                                            }}>
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-amber-500">
                                                <img
                                                    src={`http://127.0.0.1:5000/api/nba-image/${lastGameStarters.find(p => p.position === 'C')?.player_id}`}
                                                    alt={lastGameStarters.find(p => p.position === 'C')?.name}
                                                    className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const initials = lastGameStarters.find(p => p.position === 'C')?.name
                                                                .split(' ')
                                                                .map((n: string) => n[0])
                                                                .join('')
                                                                .toUpperCase()
                                                                .substring(0, 2);
                                                            parent.innerHTML = `
                                                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center border-2 border-amber-500">
                                                        <span class="text-xl font-bold text-white">${initials}</span>
                                                    </div>
                                                `;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className='flex flex-row justify-center mt-1'>
                                                <div className='text-[#ababab] text-[11px] pr-1'>
                                                    #{lastGameStarters.find(p => p.position === 'C')?.jersey || ''}
                                                </div>
                                                <div className='text-white text-[11px]'>
                                                    {lastGameStarters.find(p => p.position === 'C')?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* Bottom wide (spans 2 columns) */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] col-span-2 h-235">
                <div className="p-3">
                    <h2 className="text-white mb-3">League Standings</h2>

                    {loading ? (
                        <div className="text-center py-4">
                            <p className="text-gray-400">Loading standings...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4">
                            <p className="text-red-400">Error: {error}</p>
                            <button
                                onClick={fetchStandings}
                                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                            >
                                Retry
                            </button>
                        </div>
                    ) : standings.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-gray-400">No standings data available</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {/* Table Header */}
                            <div className="grid grid-cols-[25px_1fr_repeat(8,0.3fr)] text-[#9f9f9f] font-semibold text-xs px-2 py-1 mb-3">
                                <p>#</p>
                                <p className="text-left">Team</p>
                                <p>W</p>
                                <p>L</p>
                                <p>Win%</p>
                                <p>GB</p>
                                <p>Home</p>
                                <p>Away</p>
                                <p>L10</p>
                                <p>Streak</p>
                            </div>

                            {/* Table Rows - Top 5 teams */}
                            {leagueStandings.map((team, index) => (
                                <div
                                    key={team.team_id}
                                    onClick={() => {
                                        if (team.team_id !== teamInfo.team_id) {
                                            const teamName = encodeURIComponent(team.team_name);
                                            navigate(`/team/${team.team_id}/${teamName}`);
                                        }
                                    }}
                                    className={`grid grid-cols-[25px_1fr_repeat(8,0.3fr)] text-sm text-white px-2 py-1 hover:bg-[#333] transition cursor-pointer ${team.team_id === teamInfo.team_id ? 'bg-black shadow-[inset_2px_0_0_0_#22c55e]' : ''
                                        }`}
                                >
                                    <p>{index + 1}</p>
                                    <div className="flex flex-row items-center">
                                        <img
                                            src={getTeamLogo(team.team_id)}
                                            alt={team.team_name}
                                            className="w-5 h-5 mr-3"
                                            onError={(e) => {
                                                const teamWords = team.team_name.split(' ');
                                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                            <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                            </div>
                            <span>${team.team_name}</span>
                        `;
                                                }
                                            }}
                                        />
                                        <p className="text-left">{team.team_name}</p>
                                    </div>
                                    <p>{team.wins}</p>
                                    <p>{team.losses}</p>
                                    <p>{team.win_pct.toFixed(3)}</p>
                                    <p>{formatGamesBack(team.overall_games_back)}</p>
                                    <p>{team.home_record}</p>
                                    <p>{team.away_record}</p>
                                    <p>{team.last_10_record}</p>
                                    <p className={getStreakColor(team.streak)}>{team.streak}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}