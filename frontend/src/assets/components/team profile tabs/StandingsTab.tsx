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


type ViewMode = 'all' | 'conference' | 'division';

export default function TeamStandingsTab({ teamInfo }: TeamOverviewTabProps) {
    const [standings, setStandings] = useState<TeamStandingWithGB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('all');

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

    const getGamesBack = (team: TeamStandingWithGB): number => {
        switch (viewMode) {
            case 'all':
                return team.overall_games_back;
            case 'division':
                return team.division_games_back;
            case 'conference':
            default:
                return team.games_back;
        }
    };

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

    // Get appropriate rankings based on view mode
    const getRankedStandings = () => {
        const filtered = [...standings];

        switch (viewMode) {
            case 'all':
                // Sort all teams by win percentage
                return filtered.sort((a, b) => b.win_pct - a.win_pct);

            case 'conference':
                // Sort by conference, then by win percentage within conference
                return filtered.sort((a, b) => {
                    if (a.team_conference !== b.team_conference) {
                        return a.team_conference === 'East' ? -1 : 1;
                    }
                    return b.win_pct - a.win_pct;
                });

            case 'division':
                // Sort by conference, then division, then win percentage within division
                return filtered.sort((a, b) => {
                    if (a.team_conference !== b.team_conference) {
                        return a.team_conference === 'East' ? -1 : 1;
                    }
                    if (a.team_division !== b.team_division) {
                        return a.team_division.localeCompare(b.team_division);
                    }
                    return b.win_pct - a.win_pct;
                });

            default:
                return filtered;
        }
    };

    const displayStandings = getRankedStandings();

    // Group standings for different views
    const easternTeams = displayStandings.filter(team => team.team_conference === 'East');
    const westernTeams = displayStandings.filter(team => team.team_conference === 'West');

    const divisionGroups: Record<string, TeamStandingWithGB[]> = {};
    displayStandings.forEach(team => {
        if (!divisionGroups[team.team_division]) {
            divisionGroups[team.team_division] = [];
        }
        divisionGroups[team.team_division].push(team);
    });

    const sortedDivisionKeys = Object.keys(divisionGroups).sort((a, b) => {
        const aIsEast = a.includes('Atlantic') || a.includes('Central') || a.includes('Southeast');
        const bIsEast = b.includes('Atlantic') || b.includes('Central') || b.includes('Southeast');
        if (aIsEast && !bIsEast) return -1;
        if (!aIsEast && bIsEast) return 1;
        return a.localeCompare(b);
    });

    const renderStandingsTable = (teams: TeamStandingWithGB[], showHeader = false) => (
        <div className="w-full">
            {/* Table Header - Matching OverviewTab style */}
            <div className="grid grid-cols-[25px_1fr_repeat(8,0.3fr)] text-[#9f9f9f] font-semibold text-xs px-2 py-1 mb-3">
                <p>{viewMode === 'all' ? '#' : viewMode === 'conference' ? 'Conf' : 'Div'}</p>
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

            {/* Table Rows */}
            {teams.map((team, index) => {
                const rank = viewMode === 'all'
                    ? index + 1
                    : viewMode === 'conference'
                        ? team.conference_rank
                        : team.division_rank;

                const gamesBack = getGamesBack(team);

                return (
                    <div
                        key={team.team_id}
                        className={`grid grid-cols-[25px_1fr_repeat(8,0.3fr)] text-sm px-3 py-1 hover:bg-[#333] transition ${team.team_id === teamInfo.team_id ? 'bg-black shadow-[inset_2px_0_0_0_#22c55e]' : ''
                                        }`}
                    >
                        <p>{rank}</p>
                        <div className="flex flex-row items-center">
                            <img
                                src={`http://127.0.0.1:5000/api/team-logo/${team.team_id}`}
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
                        <p>{formatGamesBack(gamesBack)}</p>
                        <p>{team.home_record}</p>
                        <p>{team.away_record}</p>
                        <p>{team.last_10_record}</p>
                        <p className={getStreakColor(team.streak)}>{team.streak}</p>
                    </div>
                );
            })}
        </div>
    );

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
            <div className="w-full text-white border-2 border-green-400 bg-[#1d1d1d] rounded-2xl pb-5 pt-5">
                <div className="overflow-x-auto mx-auto ml-4">
                    {/* View Mode Toggle Buttons - Centered */}
                    <div className="flex mb-6 space-x-4">
                        <button
                            className={`px-4 py-2 rounded-3xl font-medium text-sm ${viewMode === 'all' ? 'bg-white text-black' : 'bg-[#333333] text-white'}`}
                            onClick={() => setViewMode('all')}
                        >
                            All Teams
                        </button>
                        <button
                            className={`px-4 py-2 rounded-3xl font-medium text-sm ${viewMode === 'conference' ? 'bg-white text-black' : 'bg-[#333333] text-white'}`}
                            onClick={() => setViewMode('conference')}
                        >
                            By Conference
                        </button>
                        <button
                            className={`px-4 py-2 rounded-3xl font-medium text-sm ${viewMode === 'division' ? 'bg-white text-black' : 'bg-[#333333] text-white'}`}
                            onClick={() => setViewMode('division')}
                        >
                            By Division
                        </button>
                    </div>

                    {/* Standings Content */}
                    {viewMode === 'all' && (
                        renderStandingsTable(displayStandings)
                    )}

                    {viewMode === 'conference' && (
                        <div className="space-y-8">
                            {/* Eastern Conference */}
                            {easternTeams.length > 0 && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                        <h4 className="text-lg font-bold">Eastern Conference</h4>
                                    </div>
                                    {renderStandingsTable(easternTeams)}
                                </div>
                            )}

                            {/* Western Conference */}
                            {westernTeams.length > 0 && (
                                <div>
                                    <div className="flex items-center mb-2 mt-6">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                        <h4 className="text-lg font-bold">Western Conference</h4>
                                    </div>
                                    {renderStandingsTable(westernTeams)}
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'division' && (
                        <div className="space-y-8">
                            {sortedDivisionKeys.map(division => (
                                <div key={division}>
                                    <div className="flex items-center mb-2">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                        <h4 className="text-lg font-bold">{division}</h4>
                                    </div>
                                    {renderStandingsTable(divisionGroups[division])}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}