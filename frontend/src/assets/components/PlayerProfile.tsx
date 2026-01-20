// assets/components/playerprofile/PlayerProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

interface PlayerInfo {
    player_id: number;
    player_name: string;
    team_id: number;
    team_name: string;
    jersey_number: string;
    position: string;
    height: string;
    weight: string;
    age: number;
    experience: string;
    college: string;
    country: string;
    draft_year: number;
    draft_round: number;
    draft_pick: number;
}

interface SeasonStats {
    season: string;
    games_played: number;
    games_started: number;
    minutes_per_game: number;
    points_per_game: number;
    rebounds_per_game: number;
    assists_per_game: number;
    steals_per_game: number;
    blocks_per_game: number;
    turnovers_per_game: number;
    field_goal_percentage: number;
    three_point_percentage: number;
    free_throw_percentage: number;
}

interface CareerAverages {
    games_played: number;
    points_per_game: number;
    rebounds_per_game: number;
    assists_per_game: number;
    steals_per_game: number;
    blocks_per_game: number;
}

interface PlayerData {
    player_info: PlayerInfo;
    current_season_stats: SeasonStats;
    career_averages: CareerAverages;
    season_history: SeasonStats[];
}

export default function PlayerProfilePage() {
    const { playerId, playerName } = useParams<{ playerId: string; playerName: string }>();
    const navigate = useNavigate();
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'stats' | 'gamelog' | 'bio'>('stats');

    useEffect(() => {
        fetchPlayerData();
    }, [playerId]);

    const fetchPlayerData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/profile`);
            const data = await response.json();

            if (data.success) {
                setPlayerData(data.data);
            } else {
                setError(data.message || 'Failed to load player data');
            }
        } catch (err) {
            console.error('Error fetching player data:', err);
            setError('Failed to fetch player data');
        } finally {
            setLoading(false);
        }
    };

    const formatHeight = (height: string) => {
        if (height.includes("'")) return height;
        if (height.includes('-')) {
            const [feet, inches] = height.split('-');
            return `${feet}'${inches}"`;
        }
        return height;
    };

    const getPlayerImage = () => {
        return `http://127.0.0.1:5000/api/player/${playerId}/image`;
    };

    const getTeamLogo = (teamId: number) => {
        return `http://127.0.0.1:5000/api/team-logo/${teamId}`;
    };

    const getPositionColor = (position: string) => {
        const pos = position?.toUpperCase() || '';
        if (pos.includes('G')) return 'bg-blue-500/20 text-blue-400';
        if (pos.includes('F')) return 'bg-green-500/20 text-green-400';
        if (pos.includes('C')) return 'bg-purple-500/20 text-purple-400';
        return 'bg-gray-500/20 text-gray-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-800 rounded w-24 mb-6"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <div className="h-96 bg-gray-800 rounded-2xl"></div>
                            </div>
                            <div>
                                <div className="h-96 bg-gray-800 rounded-2xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !playerData) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] p-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center text-white"
                    >
                        ← Back
                    </button>
                    <div className="text-red-500 text-center py-20">Error: {error}</div>
                    <div className="text-center">
                        <button
                            onClick={fetchPlayerData}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { player_info, current_season_stats, career_averages } = playerData;

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>

                {/* Player Header */}
                <div className="border-2 border-blue-500/50 rounded-2xl bg-gradient-to-r from-gray-900/50 to-gray-800/30 p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Player Image */}
                        <div className="w-48 h-48 rounded-full bg-gray-800 border-4 border-blue-500/50 overflow-hidden">
                            <img
                                src={getPlayerImage()}
                                alt={player_info.player_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        const initials = player_info.player_name
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .substring(0, 2);
                                        parent.innerHTML = `
                                            <div class="w-full h-full flex items-center justify-center">
                                                <span class="text-6xl font-bold text-gray-400">${initials}</span>
                                            </div>
                                        `;
                                    }
                                }}
                            />
                        </div>

                        {/* Player Info */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2">{player_info.player_name}</h1>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Link
                                            to={`/team/${player_info.team_id}/${encodeURIComponent(player_info.team_name)}`}
                                            className="flex items-center gap-2 hover:opacity-80 transition"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                                <img
                                                    src={getTeamLogo(player_info.team_id)}
                                                    alt={player_info.team_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-blue-400 font-medium">{player_info.team_name}</span>
                                        </Link>
                                        <div className="flex items-center gap-4">
                                            <span className="px-3 py-1 bg-gray-800 rounded-full font-bold">
                                                #{player_info.jersey_number}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full font-medium ${getPositionColor(player_info.position)}`}>
                                                {player_info.position}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-800/50 p-4 rounded-xl">
                                    <div className="text-gray-400 text-sm">Height</div>
                                    <div className="text-xl font-bold">{formatHeight(player_info.height)}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-xl">
                                    <div className="text-gray-400 text-sm">Weight</div>
                                    <div className="text-xl font-bold">{player_info.weight}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-xl">
                                    <div className="text-gray-400 text-sm">Age</div>
                                    <div className="text-xl font-bold">{player_info.age}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-xl">
                                    <div className="text-gray-400 text-sm">Experience</div>
                                    <div className="text-xl font-bold">
                                        {player_info.experience === 'Rookie' || player_info.experience === '0'
                                            ? 'Rookie'
                                            : `${player_info.experience} Years`}
                                    </div>
                                </div>
                            </div>

                            {/* Bio Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-800/30 p-3 rounded-lg">
                                    <div className="text-gray-400 text-xs">College</div>
                                    <div className="font-medium">{player_info.college || 'N/A'}</div>
                                </div>
                                <div className="bg-gray-800/30 p-3 rounded-lg">
                                    <div className="text-gray-400 text-xs">Country</div>
                                    <div className="font-medium">{player_info.country || 'N/A'}</div>
                                </div>
                                <div className="bg-gray-800/30 p-3 rounded-lg">
                                    <div className="text-gray-400 text-xs">Draft</div>
                                    <div className="font-medium">
                                        {player_info.draft_year
                                            ? `${player_info.draft_year} (R${player_info.draft_round} P${player_info.draft_pick})`
                                            : 'Undrafted'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-800 mb-6">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-6 py-3 font-medium text-lg ${activeTab === 'stats'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-white'}`}
                    >
                        Season Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('gamelog')}
                        className={`px-6 py-3 font-medium text-lg ${activeTab === 'gamelog'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-white'}`}
                    >
                        Game Log
                    </button>
                    <button
                        onClick={() => setActiveTab('bio')}
                        className={`px-6 py-3 font-medium text-lg ${activeTab === 'bio'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-white'}`}
                    >
                        Biography
                    </button>
                </div>

            </div>
        </div>
    );
}