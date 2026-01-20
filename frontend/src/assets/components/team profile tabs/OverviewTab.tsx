// assets/components/teamprofile/tabs/TeamOverviewTab.tsx
import { useEffect, useState } from "react";

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

export default function TeamOverviewTab({ teamInfo }: TeamOverviewTabProps) {
    const [standings, setStandings] = useState<TeamStandingWithGB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            {/* Top left */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] h-40">
                <h2 className="ml-3 mt-3 text-white">Team Form</h2>
            </div>
            {/* Top middle */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] h-40">
                <h2 className="ml-3 mt-3 text-white">Next Match</h2>
            </div>
            {/* Right tall (spans both rows) */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] row-span-2 h-110">
                <div className="h-19 flex items-center flex-row-reverse">
                    <h2 className="text-white mr-5">Last Starting 5</h2>
                </div>
                <div className="relative h-90 bg-[#1d1d1d] rounded-2xl">
                    <div className="relative h-full bg-[#2c2c2c] overflow-hidden rounded-b-2xl">
                        {/* Court Base */}
                        <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                        {/* Baseline */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#343434]"></div>

                        {/* Three-Point Line (your original but vertical) */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                            <div className="w-[360px] h-[280px] border-4 border-[#343434] rounded-b-full rounded-l-3xl border-t-0"></div>
                        </div>

                        {/* Key/Paint Area (vertical version of your key) */}
                        <div className="absolute top-0 left-1/3 right-1/3 h-9/20 border-x-4 border-[#343434]"></div>

                        {/* Free Throw Line */}
                        <div className="absolute top-9/20 left-1/3 right-1/3 h-1 bg-[#343434]"></div>
                        {/* Free Throw Circle (your circle but half) */}
                        <div className="absolute top-7/20 left-1/2 w-20 h-20 border-4 border-[#343434] rounded-full transform -translate-x-1/2"></div>

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
                                    className={`grid grid-cols-[25px_1fr_repeat(8,0.3fr)] text-sm text-white px-2 py-1 hover:bg-[#333] transition ${team.team_id === teamInfo.team_id ? 'bg-black shadow-[inset_2px_0_0_0_#22c55e]' : ''
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
                                    <p>{team.win_pct}</p>
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