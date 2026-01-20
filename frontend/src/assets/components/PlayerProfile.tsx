// assets/components/playerprofile/PlayerProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

interface PlayerStats {
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

interface PlayerData {
    player_info: PlayerInfo;
    current_season_stats: PlayerStats;
}

export default function PlayerProfilePage() {
    const { playerId, playerName } = useParams<{ playerId: string; playerName: string }>();
    const navigate = useNavigate();
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPlayerData();
    }, [playerId]);

    const fetchPlayerData = async () => {
        try {
            setLoading(true);
            console.log('Fetching player data for ID:', playerId);

            // Try to fetch player data from your API
            const response = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/profile`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Player data received:', data);

            if (data.success) {
                setPlayerData(data.data);
            } else {
                // If API doesn't have data yet, create a mock player with the info we have
                const mockPlayer: PlayerData = {
                    player_info: {
                        player_id: parseInt(playerId || '0'),
                        player_name: decodeURIComponent(playerName || 'Unknown Player'),
                        team_id: 0,
                        team_name: 'Unknown Team',
                        jersey_number: '00',
                        position: 'Unknown',
                        height: '6-0',
                        weight: '200',
                        age: 25,
                        experience: 'Rookie',
                        college: 'Unknown',
                        country: 'Unknown',
                        draft_year: 0,
                        draft_round: 0,
                        draft_pick: 0
                    },
                    current_season_stats: {
                        season: '2023-24',
                        games_played: 0,
                        games_started: 0,
                        minutes_per_game: 0,
                        points_per_game: 0,
                        rebounds_per_game: 0,
                        assists_per_game: 0,
                        steals_per_game: 0,
                        blocks_per_game: 0,
                        turnovers_per_game: 0,
                        field_goal_percentage: 0,
                        three_point_percentage: 0,
                        free_throw_percentage: 0
                    }
                };
                setPlayerData(mockPlayer);
            }
        } catch (err) {
            console.error('Error fetching player data:', err);
            // Create mock data for testing
            const mockPlayer: PlayerData = {
                player_info: {
                    player_id: parseInt(playerId || '0'),
                    player_name: decodeURIComponent(playerName || 'Unknown Player'),
                    team_id: 0,
                    team_name: 'Los Angeles Lakers',
                    jersey_number: '23',
                    position: 'SF',
                    height: '6-9',
                    weight: '250',
                    age: 29,
                    experience: '8',
                    college: 'Duke',
                    country: 'USA',
                    draft_year: 2015,
                    draft_round: 1,
                    draft_pick: 3
                },
                current_season_stats: {
                    season: '2023-24',
                    games_played: 65,
                    games_started: 65,
                    minutes_per_game: 35.2,
                    points_per_game: 27.8,
                    rebounds_per_game: 8.1,
                    assists_per_game: 6.3,
                    steals_per_game: 1.5,
                    blocks_per_game: 0.8,
                    turnovers_per_game: 3.2,
                    field_goal_percentage: 0.512,
                    three_point_percentage: 0.386,
                    free_throw_percentage: 0.872
                }
            };
            setPlayerData(mockPlayer);
            setError('Using mock data - API not connected');
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

    const getPositionColor = (position: string) => {
        const pos = position?.toUpperCase() || '';
        if (pos.includes('G')) return 'bg-blue-500/20 text-blue-400';
        if (pos.includes('F')) return 'bg-green-500/20 text-green-400';
        if (pos.includes('C')) return 'bg-purple-500/20 text-purple-400';
        return 'bg-gray-500/20 text-gray-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] p-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center text-white"
                    >
                        ← Back
                    </button>
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-white">Loading player profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!playerData) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] p-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center text-white"
                    >
                        ← Back
                    </button>
                    <div className="text-red-500 text-center py-20">Error: Could not load player data</div>
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

    const { player_info, current_season_stats } = playerData;

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
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gray-800 border-4 border-blue-500/50 overflow-hidden">
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
                                                <span class="text-4xl md:text-6xl font-bold text-gray-400">${initials}</span>
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
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{player_info.player_name}</h1>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                                <span className="text-sm font-bold">#{player_info.jersey_number}</span>
                                            </div>
                                            <span className="text-blue-400 font-medium">{player_info.team_name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
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
                                    <div className="text-xl font-bold">{player_info.weight} lbs</div>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            ? `${player_info.draft_year} (Round ${player_info.draft_round}, Pick ${player_info.draft_pick})`
                                            : 'Undrafted'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Season Stats */}
                <div className="border-2 border-green-500/30 rounded-2xl bg-[#1a1a1a] p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-6">Current Season Stats ({current_season_stats.season})</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-400 border-b border-gray-700">
                                    <th className="pb-3 pl-4">GP</th>
                                    <th className="pb-3">GS</th>
                                    <th className="pb-3">MIN</th>
                                    <th className="pb-3">PTS</th>
                                    <th className="pb-3">REB</th>
                                    <th className="pb-3">AST</th>
                                    <th className="pb-3">STL</th>
                                    <th className="pb-3">BLK</th>
                                    <th className="pb-3">TO</th>
                                    <th className="pb-3">FG%</th>
                                    <th className="pb-3">3P%</th>
                                    <th className="pb-3 pr-4">FT%</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-800">
                                    <td className="py-4 pl-4 text-white font-bold">{current_season_stats.games_played}</td>
                                    <td className="py-4 text-white">{current_season_stats.games_started}</td>
                                    <td className="py-4 text-white">{current_season_stats.minutes_per_game.toFixed(1)}</td>
                                    <td className="py-4 text-green-400 font-bold">{current_season_stats.points_per_game.toFixed(1)}</td>
                                    <td className="py-4 text-white">{current_season_stats.rebounds_per_game.toFixed(1)}</td>
                                    <td className="py-4 text-white">{current_season_stats.assists_per_game.toFixed(1)}</td>
                                    <td className="py-4 text-white">{current_season_stats.steals_per_game.toFixed(1)}</td>
                                    <td className="py-4 text-white">{current_season_stats.blocks_per_game.toFixed(1)}</td>
                                    <td className="py-4 text-white">{current_season_stats.turnovers_per_game.toFixed(1)}</td>
                                    <td className="py-4 text-white">{(current_season_stats.field_goal_percentage * 100).toFixed(1)}%</td>
                                    <td className="py-4 text-white">{(current_season_stats.three_point_percentage * 100).toFixed(1)}%</td>
                                    <td className="py-4 pr-4 text-white">{(current_season_stats.free_throw_percentage * 100).toFixed(1)}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border-2 border-blue-500/20 rounded-2xl bg-[#1a1a1a] p-6">
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Scoring</h3>
                        <div className="text-4xl font-bold text-center">{current_season_stats.points_per_game.toFixed(1)}</div>
                        <div className="text-gray-400 text-center text-sm">Points per Game</div>
                    </div>

                    <div className="border-2 border-green-500/20 rounded-2xl bg-[#1a1a1a] p-6">
                        <h3 className="text-lg font-semibold text-green-400 mb-4">Rebounding</h3>
                        <div className="text-4xl font-bold text-center">{current_season_stats.rebounds_per_game.toFixed(1)}</div>
                        <div className="text-gray-400 text-center text-sm">Rebounds per Game</div>
                    </div>

                    <div className="border-2 border-purple-500/20 rounded-2xl bg-[#1a1a1a] p-6">
                        <h3 className="text-lg font-semibold text-purple-400 mb-4">Playmaking</h3>
                        <div className="text-4xl font-bold text-center">{current_season_stats.assists_per_game.toFixed(1)}</div>
                        <div className="text-gray-400 text-center text-sm">Assists per Game</div>
                    </div>
                </div>
            </div>
        </div>
    );
}