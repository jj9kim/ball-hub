import { useEffect, useState } from "react";

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

interface TableTabProps {
    team1Id: number;
    team2Id: number;
}

type ViewMode = 'all' | 'conference' | 'division';

export default function TableTab({ team1Id, team2Id }: TableTabProps) {
    const [standings, setStandings] = useState<TeamStanding[]>([]);
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
                setStandings(data.standings);
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

    // Calculate overall league games back
    const calculateOverallGamesBack = (team: TeamStanding): number => {
        if (standings.length === 0) return 0;

        // Find team with best record (highest win percentage)
        const bestTeam = standings.reduce((best, current) =>
            current.win_pct > best.win_pct ? current : best
        );

        if (team.team_id === bestTeam.team_id) return 0;

        // Calculate games back formula: ((leaderWins - teamWins) + (teamLosses - leaderLosses)) / 2
        const gamesBack = ((bestTeam.wins - team.wins) + (team.losses - bestTeam.losses)) / 2;
        return Math.max(0, gamesBack);
    };

    // Calculate division games back
    const calculateDivisionGamesBack = (team: TeamStanding): number => {
        if (standings.length === 0) return 0;

        // Find best team in same division
        const divisionTeams = standings.filter(t => t.team_division === team.team_division);
        if (divisionTeams.length === 0) return 0;

        const bestDivisionTeam = divisionTeams.reduce((best, current) =>
            current.win_pct > best.win_pct ? current : best
        );

        if (team.team_id === bestDivisionTeam.team_id) return 0;

        const gamesBack = ((bestDivisionTeam.wins - team.wins) + (team.losses - bestDivisionTeam.losses)) / 2;
        return Math.max(0, gamesBack);
    };

    // Get appropriate games back based on view mode
    const getGamesBack = (team: TeamStanding): number => {
        switch (viewMode) {
            case 'all':
                return calculateOverallGamesBack(team);
            case 'division':
                return calculateDivisionGamesBack(team);
            case 'conference':
            default:
                return team.games_back; // Use conference games back from API
        }
    };

    // Filter and sort standings based on view mode
    const getFilteredAndSortedStandings = () => {
        const filtered = [...standings];

        // Sort based on view mode
        switch (viewMode) {
            case 'all':
                // Sort all teams by win percentage (best to worst)
                return filtered.sort((a, b) => b.win_pct - a.win_pct);

            case 'conference':
                // Sort by conference, then by conference rank
                return filtered.sort((a, b) => {
                    if (a.team_conference !== b.team_conference) {
                        // East first, then West
                        return a.team_conference === 'East' ? -1 : 1;
                    }
                    return a.conference_rank - b.conference_rank;
                });

            case 'division':
                // Sort by conference, then division, then division rank
                return filtered.sort((a, b) => {
                    if (a.team_conference !== b.team_conference) {
                        return a.team_conference === 'East' ? -1 : 1;
                    }
                    if (a.team_division !== b.team_division) {
                        return a.team_division.localeCompare(b.team_division);
                    }
                    return a.division_rank - b.division_rank;
                });

            default:
                return filtered;
        }
    };

    const displayStandings = getFilteredAndSortedStandings();

    // Group standings by conference for display
    const easternTeams = displayStandings.filter(team => team.team_conference === 'East');
    const westernTeams = displayStandings.filter(team => team.team_conference === 'West');

    // Group standings by division for display
    const divisionGroups: Record<string, TeamStanding[]> = {};
    displayStandings.forEach(team => {
        if (!divisionGroups[team.team_division]) {
            divisionGroups[team.team_division] = [];
        }
        divisionGroups[team.team_division].push(team);
    });

    // Get division order: East divisions first, then West divisions
    const sortedDivisionKeys = Object.keys(divisionGroups).sort((a, b) => {
        const aIsEast = a.includes('Atlantic') || a.includes('Central') || a.includes('Southeast');
        const bIsEast = b.includes('Atlantic') || b.includes('Central') || b.includes('Southeast');
        if (aIsEast && !bIsEast) return -1;
        if (!aIsEast && bIsEast) return 1;
        return a.localeCompare(b);
    });

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

    const renderStandingsTable = (teams: TeamStanding[], showConferenceHeader = false, showDivisionHeader = false) => (
        <div className="overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-[30px_1fr_repeat(8,0.5fr)] bg-[#2b2b2b] text-gray-300 font-semibold text-xs px-3 py-2 border-b border-gray-700">
                <p className="text-center">
                    {viewMode === 'all' ? 'Rank' :
                        viewMode === 'conference' ? 'Conf' :
                            'Div'}
                </p>
                <p className="text-left pl-3">Team</p>
                <p className="text-center">W</p>
                <p className="text-center">L</p>
                <p className="text-center">PCT</p>
                <p className="text-center">GB</p>
                <p className="text-center">Home</p>
                <p className="text-center">Road</p>
                <p className="text-center">L10</p>
                <p className="text-center">Streak</p>
            </div>

            {/* Rows */}
            {teams.map((team, index) => {

                // Get rank based on view mode and context
                let rank;
                if (viewMode === 'all') {
                    rank = index + 1;
                } else if (viewMode === 'conference') {
                    rank = team.conference_rank;
                } else {
                    rank = team.division_rank;
                }

                const gamesBack = getGamesBack(team);

                return (
                    <div
                        key={team.team_id}
                        className={`grid grid-cols-[30px_1fr_repeat(8,0.5fr)] text-sm px-3 py-2 items-center 
                            ${team.team_id === team1Id || team.team_id === team2Id
                                ? 'bg-blue-900/30 border-l-4 border-blue-500'
                                : 'bg-[#1c1c1c] hover:bg-[#2a2a2a]'
                            } transition-colors`}
                    >
                        {/* Rank */}
                        <p className="text-center font-bold">{rank}</p>

                        {/* Team Name with Logo */}
                        <div className="flex items-center pl-3">
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
                            <div className="flex flex-col">
                                <span className="font-medium">{team.team_name}</span>
                                <span className="text-xs text-gray-400">
                                    {showDivisionHeader ? team.team_conference :
                                        showConferenceHeader ? team.team_division :
                                            `${team.team_conference} • ${team.team_division}`}
                                </span>
                            </div>
                        </div>

                        {/* Wins */}
                        <p className="text-center font-bold">{team.wins}</p>

                        {/* Losses */}
                        <p className="text-center">{team.losses}</p>

                        {/* Win Percentage */}
                        <p className="text-center">{team.win_pct}</p>

                        {/* Games Back */}
                        <p className="text-center">
                            {gamesBack === 0 ? '—' : gamesBack.toFixed(1)}
                        </p>

                        {/* Home Record */}
                        <p className="text-center text-sm">{team.home_record}</p>

                        {/* Away Record */}
                        <p className="text-center text-sm">{team.away_record}</p>

                        {/* Last 10 */}
                        <p className="text-center text-sm">{team.last_10_record}</p>

                        {/* Streak */}
                        <p className={`text-center font-bold ${team.streak.startsWith('W') ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {team.streak}
                        </p>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="w-full text-white mt-2 mb-5 p-2">
            <h3 className="text-xl font-bold mb-4 text-center">NBA Standings</h3>

            {/* View Mode Selection - Only 3 buttons now */}
            <div className="flex justify-center mb-6 space-x-4">
                <button
                    className={`px-4 py-2 rounded ${viewMode === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setViewMode('all')}
                >
                    All Teams
                </button>
                <button
                    className={`px-4 py-2 rounded ${viewMode === 'conference' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setViewMode('conference')}
                >
                    By Conference
                </button>
                <button
                    className={`px-4 py-2 rounded ${viewMode === 'division' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setViewMode('division')}
                >
                    By Division
                </button>
            </div>

            {/* View Mode Indicator */}
            <div className="text-center mb-6 text-gray-400">
                {viewMode === 'all' && 'Sorted by Win Percentage • GB = Games Behind League Leader'}
                {viewMode === 'conference' && 'Sorted by Conference • GB = Games Behind Conference Leader'}
                {viewMode === 'division' && 'Sorted by Division • GB = Games Behind Division Leader'}
            </div>

            <div className="max-w-5xl mx-auto">
                {/* Render standings based on view mode */}
                {viewMode === 'all' && (
                    <div className="mb-8">
                        {renderStandingsTable(displayStandings)}
                    </div>
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
                                {renderStandingsTable(easternTeams, true)}
                            </div>
                        )}

                        {/* Western Conference */}
                        {westernTeams.length > 0 && (
                            <div>
                                <div className="flex items-center mb-2 mt-6">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                    <h4 className="text-lg font-bold">Western Conference</h4>
                                </div>
                                {renderStandingsTable(westernTeams, true)}
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
                                {renderStandingsTable(divisionGroups[division], false, true)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-8 p-4 bg-[#2c2c2c] rounded-lg max-w-5xl mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span>Current Game Teams</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>Winning Streak</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span>Losing Streak</span>
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center mt-6">
                <button
                    onClick={fetchStandings}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
                >
                    Refresh Standings
                </button>
            </div>
        </div>
    );
}