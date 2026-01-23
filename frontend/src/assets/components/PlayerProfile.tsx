// assets/components/playerprofile/PlayerProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// API RESPONSE INTERFACE - ONLY PLAYER INFO (no career stats)
interface ApiPlayerInfo {
    PERSON_ID: number;
    FIRST_NAME: string;
    LAST_NAME: string;
    DISPLAY_FIRST_LAST: string;
    DISPLAY_LAST_COMMA_FIRST: string;
    DISPLAY_FI_LAST: string;
    PLAYER_SLUG: string;
    BIRTHDATE: string | null;
    SCHOOL: string;
    COUNTRY: string;
    LAST_AFFILIATION: string;
    HEIGHT: string;
    WEIGHT: string | number;
    SEASON_EXP: string;
    JERSEY: string;
    POSITION: string;
    ROSTERSTATUS: string;
    GAMES_PLAYED_CURRENT_SEASON_FLAG: string;
    TEAM_ID: number;
    TEAM_NAME: string;
    TEAM_ABBREVIATION: string;
    TEAM_CODE: string;
    TEAM_CITY: string;
    PLAYERCODE: string;
    FROM_YEAR: string;
    TO_YEAR: string;
    DLEAGUE_FLAG: string;
    NBA_FLAG: string;
    GAMES_PLAYED_FLAG: string;
    DRAFT_YEAR: number | null;
    DRAFT_ROUND: number | null;
    DRAFT_NUMBER: number | null;
    GREATEST_75_FLAG: string;
}

interface ApiResponse {
    success: boolean;
    player_info: ApiPlayerInfo;
}

export default function PlayerProfilePage() {
    const { playerId, playerName } = useParams<{ playerId: string; playerName: string }>();
    const navigate = useNavigate();
    const [playerInfo, setPlayerInfo] = useState<ApiPlayerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);

        // Also scroll to top when playerId changes
        return () => {
            // Optional: Cleanup if needed
        };
    }, [playerId]);

    useEffect(() => {
        fetchPlayerData();
    }, [playerId]);

    const fetchPlayerData = async () => {
        try {
            setLoading(true);
            console.log('Fetching player data for ID:', playerId);

            const response = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/profile`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();
            console.log('Player data received:', data);

            if (data.success) {
                setPlayerInfo(data.player_info);
            } else {
                setError('Failed to load player data');
            }
        } catch (err) {
            console.error('Error fetching player data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch player data');
        } finally {
            setLoading(false);
        }
    };

    const getTeamLogo = (teamId: number) => {
        return `http://127.0.0.1:5000/api/team-logo/${teamId}`;
    };

    // Helper functions
    const formatHeight = (height: string) => {
        if (height.includes("'")) return height;
        if (height.includes('-')) {
            const [feet, inches] = height.split('-');
            return `${feet}'${inches}"`;
        }
        return height;
    };

    const calculateAge = (birthdate: string | null): number | null => {
        if (!birthdate) return null;
        try {
            const birthDate = new Date(birthdate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch {
            return null;
        }
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

    const formatWeight = (weight: string | number): string => {
        if (!weight) return 'N/A';
        return `${weight} lbs`;
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

    if (error || !playerInfo) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] p-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center text-white"
                    >
                        ← Back
                    </button>
                    <div className="text-red-500 text-center py-20">Error: {error || 'Could not load player data'}</div>
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

    const age = calculateAge(playerInfo.BIRTHDATE);

    return (
        <div className="bg-black pt-20 flex justify-center min-h-screen">
            <div className='border-white border-2 w-7/8 h-335'>
                <div className="flex flex-row mb-3">
                    <div className='w-3/5 border-2 border-cyan-500 h-110 bg-[#1d1d1d] rounded-2xl mr-2'>
                        <div className="flex items-center">
                            <div className='border-2 border-amber-300 w-full rounded-t-2xl'>
                                <div className='flex flex-row items-center p-4'>
                                    <div className="mr-5 ml-3">
                                        <img
                                            src={getPlayerImage()}
                                            alt={playerInfo.DISPLAY_FIRST_LAST}
                                            className="w-24 h-24 rounded-2xl object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    const initials = playerInfo.DISPLAY_FIRST_LAST
                                                        .split(' ')
                                                        .map(n => n[0])
                                                        .join('')
                                                        .toUpperCase()
                                                        .substring(0, 2);
                                                    parent.innerHTML = `
                            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                                <span class="text-3xl font-bold text-white">${initials}</span>
                            </div>
                        `;
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Player Info */}
                                    <div className='flex flex-col ml-3'>
                                        <h2 className="text-3xl font-bold text-white whitespace-nowrap">{playerInfo.DISPLAY_FIRST_LAST}</h2>
                                        <div className='flex flex-row items-center'>
                                            <img
                                                src={getTeamLogo(playerInfo.TEAM_ID)}
                                                alt={playerInfo.TEAM_NAME}
                                                className="w-7 h-7 mr-2"
                                                onError={(e) => {
                                                    const teamWords = playerInfo.TEAM_NAME.split(' ');
                                                    const teamAbbreviation = teamWords[teamWords.length - 1];
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `
                                <div class="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                    <span class="text-xs font-bold text-white">${teamAbbreviation.substring(0, 2)}</span>
                                </div>
                            `;
                                                    }
                                                }}
                                            />
                                            <h2 className="text-white font-light">{playerInfo.TEAM_CITY} {playerInfo.TEAM_NAME}</h2>
                                        </div>
                                    </div>

                                    {/* Button with ml-auto to push it to the right */}
                                    <button className='ml-auto bg-white rounded-2xl px-3 py-1 hover:bg-[#dedcdc] mr-7'>
                                        Follow
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className='border-2 border-red-200 h-77 rounded-b-2xl flex'>
                            <div className='w-1/2 border-y-2 border-y-amber-900 h-77 border-r-1 border-[#333333]'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <h2>{formatHeight(playerInfo.HEIGHT)}</h2>
                                        <h2>Height</h2>
                                    </div>
                                    <div>
                                        <h2>#{playerInfo.JERSEY}</h2>
                                        <h2>Jersey</h2>
                                    </div>
                                    <div>
                                        <h2>{playerInfo.WEIGHT} lbs</h2>
                                        <h2>Weight</h2>
                                    </div>
                                    <div>
                                        <h2>{playerInfo.BIRTHDATE ? Math.floor((new Date().getTime() - new Date(playerInfo.BIRTHDATE).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 'N/A'} years</h2>
                                        <h2>{playerInfo.BIRTHDATE ? new Date(playerInfo.BIRTHDATE).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}</h2>
                                    </div>
                                    <div>
                                        <h2>{playerInfo.COUNTRY}</h2>
                                        <h2>Country</h2>
                                    </div>
                                    <div>
                                        <h2>{playerInfo.SCHOOL}</h2>
                                        <h2>College</h2>
                                    </div>
                                    <div>{!playerInfo.DRAFT_NUMBER || String(playerInfo.DRAFT_NUMBER).toLowerCase() === 'undrafted' ? (
                                        <h2>Undrafted</h2>
                                    ) : (
                                        <h2>Round {playerInfo.DRAFT_ROUND} Pick {playerInfo.DRAFT_NUMBER}, {playerInfo.DRAFT_YEAR}</h2>
                                    )}
                                        <h2>Draft</h2>
                                    </div>
                                </div>
                            </div>
                            <div className='w-1/2 border-y-2 border-y-teal-600 h-77'>

                            </div>
                        </div>
                    </div>
                    <div className='w-2/5 border-2 border-cyan-700 h-50 bg-[#1d1d1d] rounded-2xl ml-2'>
                    </div>
                </div>
            </div>
        </div>
    );
}