import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface TeamBasicInfo {
    team_id: number;
    team_name: string;
    team_city: string;
    full_name: string;
}

interface Player {
    player_id: number;
    player_name: string;
    display_name: string;
    jersey_number: string;
    position: string;
    height: string;
    height_raw: string;
    weight: string;
    weight_raw: number | null;
    birth_date: string;
    age: number | null;
    experience: string;
    experience_raw: string;
    college: string;
    country: string;
    how_acquired: string;
}

interface Coach {
    coach_name: string;
    coach_type: string;
    is_assistant: boolean;
    sort_sequence: number;
}

interface RosterData {
    players: Player[];
    coaches: Coach[];
    player_count: number;
    coach_count: number;
}

// Team ID to name mapping
const teamIdToName: Record<number, string> = {
    1610612737: 'Atlanta Hawks',
    1610612738: 'Boston Celtics',
    1610612739: 'Cleveland Cavaliers',
    1610612740: 'New Orleans Pelicans',
    1610612741: 'Chicago Bulls',
    1610612742: 'Dallas Mavericks',
    1610612743: 'Denver Nuggets',
    1610612744: 'Golden State Warriors',
    1610612745: 'Houston Rockets',
    1610612746: 'Los Angeles Clippers',
    1610612747: 'Los Angeles Lakers',
    1610612748: 'Miami Heat',
    1610612749: 'Milwaukee Bucks',
    1610612750: 'Minnesota Timberwolves',
    1610612751: 'Brooklyn Nets',
    1610612752: 'New York Knicks',
    1610612753: 'Orlando Magic',
    1610612754: 'Indiana Pacers',
    1610612755: 'Philadelphia 76ers',
    1610612756: 'Phoenix Suns',
    1610612757: 'Portland Trail Blazers',
    1610612758: 'Sacramento Kings',
    1610612759: 'San Antonio Spurs',
    1610612760: 'Oklahoma City Thunder',
    1610612761: 'Toronto Raptors',
    1610612762: 'Utah Jazz',
    1610612763: 'Memphis Grizzlies',
    1610612764: 'Washington Wizards',
    1610612765: 'Detroit Pistons',
    1610612766: 'Charlotte Hornets'
};

export default function TeamProfile() {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const [teamInfo, setTeamInfo] = useState<TeamBasicInfo | null>(null);
    const [roster, setRoster] = useState<RosterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'roster' | 'coaches'>('roster');

    useEffect(() => {
        if (teamId) {
            fetchTeamData(parseInt(teamId));
        }
    }, [teamId]);

    // Normalize position to G, F, or C
    const normalizePosition = (position: string): string => {
        if (!position) return 'Unknown';

        const posUpper = position.toUpperCase();

        // Guards
        if (posUpper.includes('G')) {
            if (posUpper.includes('PG') || posUpper.includes('POINT')) return 'G';
            if (posUpper.includes('SG') || posUpper.includes('SHOOTING')) return 'G';
            if (posUpper.includes('G-F') || posUpper.includes('F-G')) {
                // G-F goes to F, F-G goes to G
                if (posUpper.includes('G-F')) return 'F';
                if (posUpper.includes('F-G')) return 'G';
            }
            return 'G';
        }

        // Forwards
        if (posUpper.includes('F')) {
            if (posUpper.includes('SF') || posUpper.includes('SMALL')) return 'F';
            if (posUpper.includes('PF') || posUpper.includes('POWER')) return 'F'; {
                // F-C goes to C, C-F goes to F
                if (posUpper.includes('F-C')) return 'C';
                if (posUpper.includes('C-F')) return 'C';
            }
            return 'F';
        }

        // Centers
        if (posUpper.includes('C')) return 'C';
        if (posUpper.includes('F-C') || posUpper.includes('C-F')) {
            return 'C';
        }

        // Default mapping for unknown positions
        return position;
    };

    // Get position display name
    const getPositionDisplayName = (normalizedPosition: string): string => {
        switch (normalizedPosition) {
            case 'G': return 'Guards';
            case 'F': return 'Forwards';
            case 'C': return 'Centers';
            default: return normalizedPosition;
        }
    };

    // Get position order for sorting
    const getPositionOrder = (position: string): number => {
        switch (position) {
            case 'G': return 1;
            case 'F': return 2;
            case 'C': return 3;
            default: return 4;
        }
    };

    // Group players by normalized position
    const groupedPlayers = roster ? roster.players.reduce((acc: Record<string, Player[]>, player) => {
        const normalizedPosition = normalizePosition(player.position);
        if (!acc[normalizedPosition]) {
            acc[normalizedPosition] = [];
        }
        acc[normalizedPosition].push(player);
        return acc;
    }, {}) : {};

    // Sort positions: G, F, C, then others
    const sortedPositions = Object.keys(groupedPlayers).sort((a, b) => {
        const orderA = getPositionOrder(a);
        const orderB = getPositionOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b);
    });

    const fetchTeamData = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            // Create basic team info from the ID
            const teamName = teamIdToName[id] || `Team ${id}`;
            const [city, name] = teamName.includes(' ') ? teamName.split(' ').slice(0, -1).join(' ') : ['Unknown', 'Team'];

            const basicInfo: TeamBasicInfo = {
                team_id: id,
                team_name: name,
                team_city: city,
                full_name: teamName
            };

            setTeamInfo(basicInfo);

            // Only fetch the roster (the endpoint that exists)
            const rosterResponse = await fetch(`http://127.0.0.1:5000/api/team/${id}/roster`);

            if (!rosterResponse.ok) {
                throw new Error(`Failed to fetch roster: ${rosterResponse.status}`);
            }

            const rosterData = await rosterResponse.json();

            if (!rosterData.success) {
                throw new Error(rosterData.error || 'Failed to load roster data');
            }

            setRoster(rosterData.roster);

        } catch (err) {
            console.error('Error fetching team data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch team information');

            // Even if roster fails, keep basic info
            if (teamId) {
                const id = parseInt(teamId);
                const teamName = teamIdToName[id] || `Team ${id}`;
                const [city, name] = teamName.includes(' ') ? teamName.split(' ').slice(0, -1).join(' ') : ['Unknown', 'Team'];

                setTeamInfo({
                    team_id: id,
                    team_name: name,
                    team_city: city,
                    full_name: teamName
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Get team logo with fallback
    const getTeamLogo = (teamId: number) => {
        return `http://127.0.0.1:5000/api/team-logo/${teamId}`;
    };

    // Get player image with fallback
    const getPlayerImage = (playerId: number) => {
        return `http://127.0.0.1:5000/api/player/${playerId}/image`;
    };

    // Format height display
    const formatHeight = (height: string) => {
        if (height.includes("'")) return height; // Already formatted
        if (height.includes('-')) {
            const [feet, inches] = height.split('-');
            return `${feet}'${inches}"`;
        }
        return height;
    };

    // Get experience display
    const getExperienceDisplay = (exp: string) => {
        if (exp === 'Rookie' || exp === '0') return 'Rookie';
        if (exp === '1') return '1st Year';
        if (!isNaN(Number(exp))) return `${exp} Years`;
        return exp;
    };

    // Get original position with multi-position indicators
    const getOriginalPosition = (player: Player): string => {
        const pos = player.position || '';
        if (pos.includes('-')) {
            return pos; // Keep G-F, F-C, etc. as is
        }
        return pos;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
                <div className="text-white text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-xl">Loading team profile...</p>
                </div>
            </div>
        );
    }

    if (!teamInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-8 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white flex items-center transition"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Overview
                    </button>

                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-center">
                        <div className="text-red-400 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Team Not Found</h2>
                        <p className="text-gray-300 mb-6">Team ID: {teamId}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header with Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center text-gray-300 hover:text-white transition"
                    >
                        <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Standings
                    </button>
                </div>

                {/* Team Header Card */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 mb-8 border border-gray-700 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start">
                        {/* Team Logo */}
                        <div className="mb-6 md:mb-0 md:mr-8">
                            <div className="relative">
                                <img
                                    src={getTeamLogo(teamInfo.team_id)}
                                    alt={teamInfo.full_name}
                                    className="w-32 h-32 md:w-40 md:h-40 object-contain bg-gray-800/50 rounded-2xl p-4 border border-gray-700"
                                    onError={(e) => {
                                        const abbreviation = teamInfo.team_name.split(' ').pop() || teamInfo.team_name.substring(0, 3).toUpperCase();
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `
                                                <div class="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl flex items-center justify-center border border-gray-700">
                                                    <span class="text-4xl md:text-5xl font-bold">${abbreviation.substring(0, 3)}</span>
                                                </div>
                                            `;
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Team Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="mb-6">
                                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    {teamInfo.full_name}
                                </h1>
                                <p className="text-gray-400">Team ID: {teamInfo.team_id}</p>
                            </div>

                            {/* Stats Grid */}
                            {roster ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                                        <p className="text-gray-400 text-sm">Players</p>
                                        <p className="text-2xl font-bold">{roster.player_count}</p>
                                        <p className="text-gray-400 text-sm">Active Roster</p>
                                    </div>

                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                                        <p className="text-gray-400 text-sm">Coaches</p>
                                        <p className="text-2xl font-bold">{roster.coach_count}</p>
                                        <p className="text-gray-400 text-sm">Staff</p>
                                    </div>

                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                                        <p className="text-gray-400 text-sm">Season</p>
                                        <p className="text-2xl font-bold">2025-26</p>
                                        <p className="text-gray-400 text-sm">Current</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
                                    <p className="text-red-300">Roster data not available</p>
                                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                                    <button
                                        onClick={() => teamId && fetchTeamData(parseInt(teamId))}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                {roster && (
                    <div className="flex overflow-x-auto mb-8 border-b border-gray-700">
                        <button
                            className={`flex-shrink-0 px-6 py-3 font-medium transition ${activeTab === 'roster'
                                ? 'text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-gray-300'}`}
                            onClick={() => setActiveTab('roster')}
                        >
                            Roster ({roster.player_count})
                        </button>
                        <button
                            className={`flex-shrink-0 px-6 py-3 font-medium transition ${activeTab === 'coaches'
                                ? 'text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-gray-300'}`}
                            onClick={() => setActiveTab('coaches')}
                        >
                            Coaches ({roster.coach_count})
                        </button>
                    </div>
                )}

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {/* Roster Tab */}
                    {activeTab === 'roster' && roster && (
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Team Roster</h3>
                                <div className="flex flex-wrap gap-4 mt-4">
                                    {sortedPositions.map(position => (
                                        <div key={position} className="flex items-center">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${position === 'G' ? 'bg-blue-500' :
                                                    position === 'F' ? 'bg-green-500' :
                                                        position === 'C' ? 'bg-purple-500' : 'bg-gray-500'
                                                }`}></div>
                                            <span className="text-gray-300">
                                                {getPositionDisplayName(position)} ({groupedPlayers[position].length})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {sortedPositions.length > 0 ? (
                                sortedPositions.map(position => (
                                    <div key={position} className="mb-12">
                                        <div className="flex items-center mb-6">
                                            <div className={`w-6 h-6 rounded-full mr-3 ${position === 'G' ? 'bg-blue-500' :
                                                    position === 'F' ? 'bg-green-500' :
                                                        position === 'C' ? 'bg-purple-500' : 'bg-gray-500'
                                                }`}></div>
                                            <h4 className="text-2xl font-bold">{getPositionDisplayName(position)}</h4>
                                            <span className="ml-4 px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full">
                                                {groupedPlayers[position].length} players
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {groupedPlayers[position]
                                                .sort((a, b) => {
                                                    const numA = parseInt(a.jersey_number) || 999;
                                                    const numB = parseInt(b.jersey_number) || 999;
                                                    return numA - numB;
                                                })
                                                .map(player => (
                                                    <div
                                                        key={player.player_id}
                                                        className={`bg-gray-800/50 rounded-xl p-4 border transition group hover:scale-[1.02] ${position === 'G' ? 'border-blue-700/30 hover:border-blue-500/50' :
                                                                position === 'F' ? 'border-green-700/30 hover:border-green-500/50' :
                                                                    position === 'C' ? 'border-purple-700/30 hover:border-purple-500/50' :
                                                                        'border-gray-700 hover:border-gray-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-start">
                                                            {/* Player Image */}
                                                            <div className="relative mr-4">
                                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition ${position === 'G' ? 'border-blue-700/50 group-hover:border-blue-500' :
                                                                        position === 'F' ? 'border-green-700/50 group-hover:border-green-500' :
                                                                            position === 'C' ? 'border-purple-700/50 group-hover:border-purple-500' :
                                                                                'border-gray-700 group-hover:border-gray-600'
                                                                    }`}>
                                                                    <img
                                                                        src={getPlayerImage(player.player_id)}
                                                                        alt={player.player_name}
                                                                        className="w-full h-full rounded-full object-cover"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const parent = e.currentTarget.parentElement;
                                                                            if (parent) {
                                                                                const initials = player.player_name
                                                                                    .split(' ')
                                                                                    .map(n => n[0])
                                                                                    .join('')
                                                                                    .toUpperCase()
                                                                                    .substring(0, 2);
                                                                                parent.innerHTML = `
                                                                                    <div class="w-full h-full rounded-full flex items-center justify-center ${position === 'G' ? 'bg-blue-900/30' :
                                                                                        position === 'F' ? 'bg-green-900/30' :
                                                                                            position === 'C' ? 'bg-purple-900/30' : 'bg-gray-900/30'
                                                                                    }">
                                                                                        <span class="text-lg font-bold">${initials}</span>
                                                                                    </div>
                                                                                `;
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center border border-gray-700">
                                                                    <span className="text-xs font-bold">#{player.jersey_number}</span>
                                                                </div>
                                                            </div>

                                                            {/* Player Info */}
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h5 className="font-bold text-lg group-hover:text-blue-400 transition">
                                                                            {player.player_name}
                                                                        </h5>
                                                                        <div className="flex items-center mt-1">
                                                                            <span className={`text-xs px-2 py-1 rounded ${position === 'G' ? 'bg-blue-500/20 text-blue-400' :
                                                                                    position === 'F' ? 'bg-green-500/20 text-green-400' :
                                                                                        position === 'C' ? 'bg-purple-500/20 text-purple-400' :
                                                                                            'bg-gray-500/20 text-gray-400'
                                                                                }`}>
                                                                                {position}
                                                                            </span>
                                                                            {player.position.includes('-') && (
                                                                                <span className="ml-2 text-xs text-gray-400">
                                                                                    ({getOriginalPosition(player)})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                                                    <div>
                                                                        <p className="text-gray-500 text-xs">Height</p>
                                                                        <p className="font-medium">{formatHeight(player.height)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 text-xs">Weight</p>
                                                                        <p className="font-medium">{player.weight}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 text-xs">Age</p>
                                                                        <p className="font-medium">{player.age || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 text-xs">Exp</p>
                                                                        <p className="font-medium">{getExperienceDisplay(player.experience)}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4">
                                                                    <p className="text-gray-500 text-xs">College</p>
                                                                    <p className="font-medium text-sm truncate">{player.college}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">No roster data available</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Coaches Tab */}
                    {activeTab === 'coaches' && roster && roster.coaches.length > 0 && (
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Coaching Staff</h3>
                                <p className="text-gray-400">
                                    {roster.coach_count} Coaches • {roster.player_count} Players
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {roster.coaches.map((coach, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-xl p-6 border transition ${coach.is_assistant
                                            ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                            : 'bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-700/50 hover:border-blue-600/50'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-xl font-bold">{coach.coach_name}</h4>
                                                <p className="text-gray-400">{coach.coach_type}</p>
                                            </div>
                                            {!coach.is_assistant && (
                                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
                                                    Head Coach
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Role:</span>
                                                <span className="font-medium">{coach.is_assistant ? 'Assistant Coach' : 'Head Coach'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Type:</span>
                                                <span className="font-medium">{coach.coach_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                    <p>Data provided by NBA API • Team ID: {teamInfo.team_id}</p>
                    <p className="mt-1 text-xs text-gray-600">
                        Position grouping: G-F → F, F-C → C, C-F → F
                    </p>
                </div>
            </div>
        </div>
    );
}