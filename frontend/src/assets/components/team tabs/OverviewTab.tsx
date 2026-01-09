import { useState, useEffect } from "react";

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
}

export default function OverviewTab() {
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
                // Calculate overall games back from first place
                const standingsWithGB = calculateOverallGamesBack(data.standings);
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

    const calculateOverallGamesBack = (standings: TeamStanding[]): TeamStandingWithGB[] => {
        // Sort by win percentage first to find the leader
        const sorted = [...standings].sort((a, b) => {
            const diff = b.win_pct - a.win_pct;
            if (diff !== 0) return diff;
            return b.conference_rank - a.conference_rank;
        });

        const leader = sorted[0];

        return sorted.map(team => {
            if (team.team_id === leader.team_id) {
                return {
                    ...team,
                    overall_games_back: 0
                };
            }

            // Calculate games back: ((leader_wins - team_wins) + (team_losses - leader_losses)) / 2
            const gamesBack = ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;

            return {
                ...team,
                overall_games_back: gamesBack
            };
        });
    };

    const getStreakColor = (streak: string) => {
        if (streak.startsWith('W')) {
            return 'text-green-400'; // Green for winning streaks
        } else if (streak.startsWith('L')) {
            return 'text-red-400'; // Red for losing streaks
        }
        return 'text-gray-400'; // Default color
    };

    const formatGamesBack = (gamesBack: number): string => {
        if (gamesBack === 0) return '-';
        return gamesBack.toFixed(1);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-white text-center py-8">
                    <div className="spinner"></div>
                    <p>Loading standings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="text-red-500">Error: {error}</div>
                <button
                    onClick={fetchStandings}
                    className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (standings.length === 0) {
        return (
            <div className="p-6">
                <div className="text-white">No standings data available.</div>
            </div>
        );
    }

    return (
        <div className="flex flex-row">
            <div className="w-3/4 text-white border-2 border-green-400 bg-[#1d1d1d] mr-3 rounded-2xl pb-5 pt-5">
                <div className="overflow-x-auto max-w-4xl mx-auto">
                    {/* Header */}
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

                    {/* Rows */}
                    {standings.map((team, index) => (
                        <div
                            key={team.team_name}
                            className={`grid grid-cols-[25px_1fr_repeat(8,0.3fr)] text-sm px-2 py-1 hover:bg-[#333] transition`}
                        >
                            <p>{index + 1}</p>
                            <div className="flex flex-row items-center">
                                <img
                                    src={`http://127.0.0.1:5000/api/team-logo/${team.team_id}`}
                                    alt={team.team_name}
                                    className="w-5 h-5 mr-3"
                                    onError={(e) => {
                                        // Fallback: Show team abbreviation
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
            </div>
            <div className="w-1/4 border-2 border-red-500 min-h-10 bg-[#1d1d1d] rounded-2xl pb-5"></div>
        </div>
    );
}