// assets/components/playerprofile/PlayerProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamFullName } from '../../utils/teamMappings';
import { calculatePlayerRating } from '../../utils/teamMappings';
import PlayerProfilePercentiles from './PlayerProfilePercentiles';

interface AllRankingStatsResponse {
    success: boolean;
    player_id: number;
    season: string;
    basic_stats: { [key: string]: any };
    hustle_stats: { [key: string]: any };
    estimated_metrics: { [key: string]: any };
    percentiles: {
        basic: { [key: string]: number };
        hustle: { [key: string]: number };
        estimated: { [key: string]: number };
    };
    total_players: {
        basic: number;
        hustle: number;
        estimated: number;
    };
    last_updated: string;
}

interface GameLogData {
    SEASON_ID: string;
    Player_ID: number;
    Game_ID: string;
    GAME_DATE: string;
    MATCHUP: string;
    WL: string;
    MIN: number;
    FGM: number;
    FGA: number;
    FG_PCT: number;
    FG3M: number;
    FG3A: number;
    FG3_PCT: number;
    FTM: number;
    FTA: number;
    FT_PCT: number;
    OREB: number;
    DREB: number;
    REB: number;
    AST: number;
    STL: number;
    BLK: number;
    TOV: number;
    PF: number;
    PTS: number;
    PLUS_MINUS: number;
    VIDEO_AVAILABLE: number;
    rating?: number;
    [key: string]: any;
}

interface GameLogResponse {
    success: boolean;
    player_id: string;
    season: string;
    season_type: string;
    gamelogs: GameLogData[];
    columns: string[];
    count: number;
}

interface SeasonGameLogs {
    season_id: string;
    season_formatted: string;
    games: GameLogData[];
    game_count: number;
    error?: string;
}

interface AllSeasonGameLogsResponse {
    success: boolean;
    player_id: string;
    seasons: { [seasonId: string]: SeasonGameLogs };
    total_seasons: number;
    total_games: number;
}

interface RawCareerData {
    PLAYER_ID: number;
    SEASON_ID: string;
    LEAGUE_ID: string;
    TEAM_ID: number;
    TEAM_ABBREVIATION: string;
    PLAYER_AGE: number | null;
    GP: number;
    GS: number;
    MIN: number;
    FGM: number;
    FGA: number;
    FG_PCT: number;
    FG3M: number;
    FG3A: number;
    FG3_PCT: number;
    FTM: number;
    FTA: number;
    FT_PCT: number;
    OREB: number;
    DREB: number;
    REB: number;
    AST: number;
    STL: number;
    BLK: number;
    TOV: number;
    PF: number;
    PTS: number;
}

interface RawCareerResponse {
    success: boolean;
    player_id: string;
    raw_data: RawCareerData[];
    columns: string[];
    row_count: number;
}

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
    const [allRankingStats, setAllRankingStats] = useState<AllRankingStatsResponse | null>(null);
    const [allStatsLoading, setAllStatsLoading] = useState(false);
    const [allSeasonGameLogs, setAllSeasonGameLogs] = useState<AllSeasonGameLogsResponse | null>(null);
    const [seasonRatings, setSeasonRatings] = useState<{ [key: string]: number }>({});
    const [seasonRatingsLoading, setSeasonRatingsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [gameLogs, setGameLogs] = useState<GameLogData[] | null>(null);
    const [gameLogsLoading, setGameLogsLoading] = useState(false);
    const [rawCareerData, setRawCareerData] = useState<RawCareerResponse | null>(null);
    const { playerId, playerName } = useParams<{ playerId: string; playerName: string }>();
    const navigate = useNavigate();
    const [playerInfo, setPlayerInfo] = useState<ApiPlayerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
        fetchPlayerData();
    }, [playerId]);

    useEffect(() => {
        if (playerId && rawCareerData) {
            fetchAllSeasonGameLogs();
        }
    }, [playerId, rawCareerData]);

    useEffect(() => {
        if (playerId) {
            fetchAllRankingStats();
        }
    }, [playerId]);

    const fetchAllRankingStats = async () => {
        if (!playerId) return;

        try {
            setAllStatsLoading(true);
            // Use the new endpoint with proper percentiles
            const response = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/stats-with-percentiles?season=2025-26`);

            if (response.ok) {
                const data: AllRankingStatsResponse = await response.json();
                if (data.success) {
                    setAllRankingStats(data);
                    console.log('All ranking stats with percentiles loaded:', data);
                }
            }
        } catch (err) {
            console.error('Error fetching all ranking stats:', err);
        } finally {
            setAllStatsLoading(false);
        }
    };

    const fetchAllSeasonGameLogs = async () => {
        if (!playerId) return;

        try {
            setSeasonRatingsLoading(true);
            console.log('Fetching all season gamelogs for player:', playerId);

            const response = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/all-season-gamelogs`);

            if (response.ok) {
                const data: AllSeasonGameLogsResponse = await response.json();
                console.log('All season gamelogs response:', data);

                if (data.success) {
                    setAllSeasonGameLogs(data);

                    // Calculate ratings for each season
                    const ratings: { [key: string]: number } = {};

                    Object.entries(data.seasons).forEach(([seasonId, seasonData]) => {
                        if (seasonData.games && seasonData.games.length > 0) {
                            const totalRating = seasonData.games.reduce((sum, game) => {
                                const rating = calculateGameRating(game);
                                return sum + rating;
                            }, 0);

                            ratings[seasonId] = totalRating / seasonData.games.length;
                            console.log(`Season ${seasonId} rating: ${ratings[seasonId]}`);
                        }
                    });

                    setSeasonRatings(ratings);
                    console.log('Calculated season ratings:', ratings);
                }
            } else {
                console.error('Failed to fetch all season gamelogs');
            }
        } catch (err) {
            console.error('Error fetching all season gamelogs:', err);
        } finally {
            setSeasonRatingsLoading(false);
        }
    };

    const fetchPlayerData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching player data for ID:', playerId);

            // Fetch player profile
            const profileResponse = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/profile`);

            if (!profileResponse.ok) {
                throw new Error(`Failed to fetch player profile: HTTP ${profileResponse.status}`);
            }

            const profileData: ApiResponse = await profileResponse.json();
            console.log('Player profile data:', profileData);

            if (profileData.success) {
                setPlayerInfo(profileData.player_info);
            } else {
                throw new Error('Failed to load player profile');
            }

            // Fetch RAW career data
            const rawResponse = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/career-stats`);

            if (rawResponse.ok) {
                const rawData: RawCareerResponse = await rawResponse.json();
                console.log('RAW career data:', rawData);

                if (rawData.success) {
                    setRawCareerData(rawData);
                }
            } else {
                console.log('No career data available');
            }

            // Fetch game logs
            await fetchPlayerGameLogs();

        } catch (err) {
            console.error('Error fetching player data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch player data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlayerGameLogs = async () => {
        try {
            setGameLogsLoading(true);
            setCurrentPage(0); // Reset to first page when loading new player
            const response = await fetch(`http://127.0.0.1:5000/api/player/${playerId}/gamelogs?season=2025-26`);

            if (response.ok) {
                const data: GameLogResponse = await response.json();
                if (data.success) {
                    // Add rating to each game log
                    const gamesWithRating = data.gamelogs.map(game => ({
                        ...game,
                        rating: calculateGameRating(game) // Calculate rating once
                    }));
                    setGameLogs(gamesWithRating);
                    console.log('Game logs loaded with ratings:', gamesWithRating.length);
                }
            }
        } catch (err) {
            console.error('Error fetching game logs:', err);
        } finally {
            setGameLogsLoading(false);
        }
    };

    // Add this helper function in your component
    const calculateGameRating = (game: GameLogData): number => {
        // Map the game log fields to match what calculatePlayerRating expects
        const playerData = {
            points: game.PTS,
            assists: game.AST,
            rebounds: game.REB,
            steals: game.STL,
            blocks: game.BLK,
            turnovers: game.TOV,
            fouls: game.PF,
            fg_made: game.FGM,
            fg_missed: game.FGA - game.FGM,
            three_made: game.FG3M,
            three_missed: game.FG3A - game.FG3M,
            ft_made: game.FTM,
            ft_missed: game.FTA - game.FTM,
            ft_attempted: game.FTA,
            ejections: 0 // Assuming this isn't in the game log data
        };

        return calculatePlayerRating(playerData);
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

    const formatSeasonId = (seasonId: string): string => {
        if (!seasonId || seasonId.length !== 5) return seasonId;

        // Convert "22023" to "2023-24"
        const year = seasonId.substring(1); // "2023"
        const nextYear = (parseInt(year) + 1).toString().substring(2); // "24"

        return `${year}-${nextYear}`;
    };

    const getCurrentSeasonStats = () => {
        if (!rawCareerData?.raw_data) return null;

        // Find the most recent season (2025-26 or whatever the current season is)
        // First, try to find by season ID pattern
        const currentSeason = rawCareerData.raw_data.find(row => {
            const seasonStr = row.SEASON_ID.toString();
            // Look for 2025 season - adjust this based on your actual season IDs
            return seasonStr.includes('2026') || seasonStr.includes('2025-26');
        });

        return currentSeason || null;
    };

    const currentSeasonStats = getCurrentSeasonStats();

    const getAverageRating = () => {
        if (!gameLogs || gameLogs.length === 0) return { value: '--', color: 'text-black' };

        const totalRating = gameLogs.reduce((sum, game) => sum + (game.rating || 0), 0);
        const average = totalRating / gameLogs.length;
        const formattedAverage = average.toFixed(2);

        // Determine color based on average rating
        let colorClass = '';
        if (average >= 7) colorClass = 'bg-[#32c771]';
        else if (average >= 5) colorClass = 'bg-orange-500';
        else if (average < 5) colorClass = 'bg-red-500';

        return { value: formattedAverage, bg: colorClass };
    };

    const getCurrentSeasonRating = () => {
        if (!gameLogs || gameLogs.length === 0) return null;

        const totalRating = gameLogs.reduce((sum, game) => sum + (game.rating || 0), 0);
        const average = totalRating / gameLogs.length;

        return {
            value: average.toFixed(2),
            color: average >= 7 ? 'bg-[#32c771] text-black' :
                average >= 5 ? 'bg-orange-500 text-black' :
                    'bg-red-500 text-black'
        };
    };

    const formatStatName = (statName: string): string => {
        const replacements: { [key: string]: string } = {
            'PTS': 'Points',
            'REB': 'Rebounds',
            'AST': 'Assists',
            'STL': 'Steals',
            'BLK': 'Blocks',
            'BLKA': 'Blocks Against',
            'TOV': 'Turnovers',
            'PF': 'Personal Fouls',
            'PFD': 'Fouls Drawn',
            'FGM': 'Field Goals Made',
            'FGA': 'Field Goals Attempted',
            'FG_PCT': 'Field Goal %',
            'FG3M': '3-Pointers Made',
            'FG3A': '3-Pointers Attempted',
            'FG3_PCT': '3-Point %',
            'FTM': 'Free Throws Made',
            'FTA': 'Free Throws Attempted',
            'FT_PCT': 'Free Throw %',
            'OREB': 'Offensive Rebounds',
            'DREB': 'Defensive Rebounds',
            'PLUS_MINUS': 'Plus/Minus',
            'MIN': 'Minutes',
            'GP': 'Games Played',
            'GS': 'Games Started',
            'W': 'Wins',
            'L': 'Losses',
            'W_PCT': 'Win %',
            'NBA_FANTASY_PTS': 'Fantasy Points',
            'DD2': 'Double Doubles',
            'TD3': 'Triple Doubles',
            'DEFLECTIONS': 'Deflections',
            'CHARGES_DRAWN': 'Charges Drawn',
            'SCREEN_ASSISTS': 'Screen Assists',
            'LOOSE_BALLS_RECOVERED': 'Loose Balls Recovered',
            'CONTESTED_SHOTS': 'Contested Shots',
            'CONTESTED_SHOTS_2PT': 'Contested 2PT Shots',
            'CONTESTED_SHOTS_3PT': 'Contested 3PT Shots',
            'E_OFF_RATING': 'Offensive Rating',
            'E_DEF_RATING': 'Defensive Rating',
            'E_NET_RATING': 'Net Rating',
            'E_PACE': 'Pace',
            'E_USG_PCT': 'Usage %',
            'E_AST_RATIO': 'Assist Ratio',
            'E_OREB_PCT': 'Off. Rebound %',
            'E_DREB_PCT': 'Def. Rebound %',
            'E_REB_PCT': 'Total Rebound %',
            'E_TOV_PCT': 'Turnover %'
        };

        // Try to find exact match first
        if (replacements[statName]) {
            return replacements[statName];
        }

        // Try to match with _RANK suffix
        if (statName.endsWith('_RANK')) {
            const baseStat = statName.replace('_RANK', '');
            return `${formatStatName(baseStat)} Rank`;
        }

        // Try to match with _PERCENTILE suffix
        if (statName.endsWith('_PERCENTILE')) {
            const baseStat = statName.replace('_PERCENTILE', '');
            return `${formatStatName(baseStat)} Percentile`;
        }

        // General formatting: replace underscores with spaces
        return statName
            .replace(/_/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Helper function to format stat value
    const formatStatValue = (statName: string, value: any): string => {
        if (value === null || value === undefined) return '--';

        // Handle percentage stats
        if (statName.includes('_PCT') || statName.includes('PERCENT') || statName.includes('RATIO')) {
            if (typeof value === 'number') {
                if (statName.includes('_PCT') && !statName.includes('RANK')) {
                    // Display as percentage (e.g., 0.455 -> 45.5%)
                    return `${(value * 100).toFixed(1)}%`;
                }
                return value.toFixed(1);
            }
            return String(value);
        }

        // Handle rank stats
        if (statName.includes('_RANK')) {
            return `#${value}`;
        }

        // Handle numeric values
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toFixed(1);
        }

        return String(value);
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
            <div className='w-7/8'>
                <div className="flex flex-row mb-3">
                    {/* Left Column - Player Info + New Div Below */}
                    <div className='w-3/5 mr-2 flex flex-col space-y-3'>
                        {/* Player Info Card */}
                        <div className='border-2 border-cyan-500 h-110 bg-[#1d1d1d] rounded-2xl'>
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
                                        <div className='w-41 border-b-1 ml-4 text-white border-[#333333] mt-5'>
                                            <h2>{formatHeight(playerInfo.HEIGHT)}</h2>
                                            <h2 className='mb-2 text-[#9f9f9f] text-sm'>Height</h2>
                                        </div>
                                        <div className='w-41 border-b-1 text-white border-[#333333] mt-5'>
                                            <h2>#{playerInfo.JERSEY}</h2>
                                            <h2 className='mb-2 text-[#9f9f9f] text-sm'>Jersey</h2>
                                        </div>
                                        <div className='w-41 border-b-1 ml-4 text-white border-[#333333]'>
                                            <h2>{playerInfo.WEIGHT} lbs</h2>
                                            <h2 className='mb-2 text-[#9f9f9f] text-sm'>Weight</h2>
                                        </div>
                                        <div className='w-41 border-b-1 text-white border-[#333333]'>
                                            <h2>{playerInfo.BIRTHDATE ? Math.floor((new Date().getTime() - new Date(playerInfo.BIRTHDATE).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 'N/A'} years</h2>
                                            <h2 className='mb-2 text-[#9f9f9f] text-sm'>{playerInfo.BIRTHDATE ? new Date(playerInfo.BIRTHDATE).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}</h2>
                                        </div>
                                        <div className='w-41 border-b-1 ml-4 text-white border-[#333333]'>
                                            <h2>{playerInfo.COUNTRY}</h2>
                                            <h2 className='mb-2 text-[#9f9f9f] text-sm'>Country</h2>
                                        </div>
                                        <div className='w-41 border-b-1 text-white border-[#333333]'>
                                            <h2>{playerInfo.SCHOOL}</h2>
                                            <h2 className='mb-2 text-[#9f9f9f] text-sm'>College</h2>
                                        </div>
                                        <div className='w-42 ml-4 text-white border-[#333333]'>{!playerInfo.DRAFT_NUMBER || String(playerInfo.DRAFT_NUMBER).toLowerCase() === 'undrafted' ? (
                                            <h2>Undrafted</h2>
                                        ) : (
                                            <h2>Round {playerInfo.DRAFT_ROUND} Pick {playerInfo.DRAFT_NUMBER}, {playerInfo.DRAFT_YEAR}</h2>
                                        )}
                                            <h2 className='text-[#9f9f9f] text-sm'>Draft</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className='w-1/2 border-y-2 border-y-teal-600 h-77 flex'>
                                    <div className='mt-5'>
                                        <h2 className='ml-5 text-white font-bold text-sm'>Position</h2>
                                    </div>
                                    <div className="relative h-50 bg-[#1d1d1d] ml-15 mt-10 rounded-[7px] w-50 overflow-hidden">
                                        <div className="relative h-full bg-[#2c2c2c]">
                                            {/* Court Base */}
                                            <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                                            {/* Baseline */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#343434]"></div>

                                            {/* Three-Point Line */}
                                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                                                <div className="w-[160px] h-[125px] border-4 border-[#343434] 
                                            rounded-b-full rounded-l-2xl border-t-0"></div>
                                            </div>

                                            {/* Key/Paint Area */}
                                            <div className="absolute top-0 left-33/100 right-33/100 h-8/20 
                                        border-x-4 border-[#343434]"></div>

                                            {/* Free Throw Line */}
                                            <div className="absolute top-8/20 left-33/100 right-33/100 h-1 bg-[#343434]"></div>

                                            {/* Free Throw Circle */}
                                            <div className="absolute top-31/100 left-1/2 w-10 h-10 border-4 
                                        border-[#343434] rounded-full transform -translate-x-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NEW DIV BELOW PLAYER INFO - SAME WIDTH */}
                        <div className='border-2 border-blue-500 h-70 bg-[#1d1d1d] rounded-2xl'>
                            <div className='w-full border-b-1 border-[#333333] h-20 flex flex-row items-center p-6'>
                                <img
                                    src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7"
                                    alt="NBA"
                                    className="w-10 h-10 mr-2"
                                />
                                <h2 className='text-white text-lg'>NBA 2025-26</h2>
                            </div>
                            <div className="p-6">
                                <div className="text-gray-400 grid grid-cols-6 grid-rows-2 gap-2 px-3">
                                    {/* Points Per Game */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? (currentSeasonStats.PTS / currentSeasonStats.GP).toFixed(1) : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Points</h3>
                                    </div>

                                    {/* Rebounds Per Game */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? (currentSeasonStats.REB / currentSeasonStats.GP).toFixed(1) : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Rebounds</h3>
                                    </div>

                                    {/* Assists Per Game */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? (currentSeasonStats.AST / currentSeasonStats.GP).toFixed(1) : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Assists</h3>
                                    </div>

                                    {/* Steals Per Game */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? (currentSeasonStats.STL / currentSeasonStats.GP).toFixed(1) : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Steals</h3>
                                    </div>

                                    {/* Blocks Per Game */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? (currentSeasonStats.BLK / currentSeasonStats.GP).toFixed(1) : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Blocks</h3>
                                    </div>

                                    {/* Turnovers Per Game */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? (currentSeasonStats.TOV / currentSeasonStats.GP).toFixed(1) : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Turnovers</h3>
                                    </div>

                                    {/* Games Started */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? currentSeasonStats.GS || '0' : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Started</h3>
                                    </div>

                                    {/* Games Played */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? currentSeasonStats.GP : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Played</h3>
                                    </div>

                                    {/* Minutes Per Game */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats ? (currentSeasonStats.MIN / currentSeasonStats.GP).toFixed(1) : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Minutes</h3>
                                    </div>


                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats && currentSeasonStats.FGA > 0
                                                ? ((currentSeasonStats.FGM / currentSeasonStats.FGA) * 100).toFixed(1) + '%'
                                                : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">FG%</h3>
                                    </div>

                                    {/* Field Goal Percentage */}
                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className="text-white text-lg font-semibold">
                                            {currentSeasonStats && currentSeasonStats.FG3M > 0
                                                ? ((currentSeasonStats.FG3M / currentSeasonStats.FG3A) * 100).toFixed(1) + '%'
                                                : '--'}
                                        </p>
                                        <h3 className="text-sm text-gray-400">3FG%</h3>
                                    </div>

                                    <div className="rounded-lg p-3 flex flex-col justify-center items-center">
                                        <p className={`text-lg font-semibold ${getAverageRating().bg} text-black px-2 rounded-md`}>
                                            {getAverageRating().value}
                                        </p>
                                        <h3 className="text-sm text-gray-400">Rating</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='border-2 border-blue-500 bg-[#1d1d1d] rounded-2xl'>
                            <div className='w-full border-b-1 border-[#333333] h-20 flex flex-row items-center p-6'>
                                <h2 className='text-white text-lg ml-2'>Game Log 2025-26</h2>
                            </div>

                            {gameLogsLoading ? (
                                <div className="p-8 text-center text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                                    <p className="text-white">Loading game logs...</p>
                                </div>
                            ) : gameLogs && gameLogs.length > 0 ? (
                                <>
                                    <div className="p-4">
                                        {/* Pagination Controls - FIXED for chronological order */}
                                        <div className="flex justify-between items-center mb-4">
                                            <button
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                disabled={(currentPage + 1) * 10 >= gameLogs.length}
                                                className={`flex items-center px-3 py-1 rounded ${(currentPage + 1) * 10 >= gameLogs.length
                                                    ? 'text-gray-500 cursor-not-allowed'
                                                    : 'text-blue-400 hover:text-blue-300 hover:bg-gray-800'
                                                    }`}
                                            >
                                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Previous Games
                                            </button>

                                            <span className="text-gray-400 text-sm">
                                                Showing {currentPage * 10 + 1}-{Math.min((currentPage + 1) * 10, gameLogs.length)} of {gameLogs.length} games
                                            </span>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                                                disabled={currentPage === 0}
                                                className={`flex items-center px-3 py-1 rounded ${currentPage === 0
                                                    ? 'text-gray-500 cursor-not-allowed'
                                                    : 'text-blue-400 hover:text-blue-300 hover:bg-gray-800'
                                                    }`}
                                            >
                                                Next Games
                                                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-white">
                                                <thead>
                                                    <tr className="border-b border-gray-700 text-xs">
                                                        <th className="py-3 px-2 text-left">Date</th>
                                                        <th className="py-3 px-2 text-left">Opponent</th>
                                                        <th className="py-3 px-2 text-center">Result</th>
                                                        <th className="py-3 px-2 text-center">MIN</th>
                                                        <th className="py-3 px-2 text-center">PTS</th>
                                                        <th className="py-3 px-2 text-center">REB</th>
                                                        <th className="py-3 px-2 text-center">AST</th>
                                                        <th className="py-3 px-2 text-center">STL</th>
                                                        <th className="py-3 px-2 text-center">BLK</th>
                                                        <th className="py-3 px-2 text-center">TOV</th>
                                                        <th className="py-3 px-2 text-center">+/-</th>
                                                        <th className="py-3 px-2 text-center">Rating</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {gameLogs.slice(currentPage * 10, (currentPage + 1) * 10).map((game, index) => {
                                                        // Format date for URL
                                                        const gameDate = new Date(game.GAME_DATE);
                                                        const formattedDate = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, '0')}-${String(gameDate.getDate()).padStart(2, '0')}`;

                                                        return (
                                                            <tr
                                                                key={index}
                                                                className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors duration-150"
                                                                onClick={() => navigate(`/${formattedDate}/game/${game.Game_ID}`)}
                                                            >
                                                                {/* Date */}
                                                                <td className="py-2 px-2 text-xs">
                                                                    {gameDate.toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </td>

                                                                {/* Opponent */}
                                                                <td className="py-2 px-2 text-xs">
                                                                    {game.MATCHUP}
                                                                </td>

                                                                {/* Result */}
                                                                <td className="py-2 px-2 text-center">
                                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${game.WL === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                        {game.WL}
                                                                    </span>
                                                                </td>

                                                                {/* Minutes */}
                                                                <td className="py-2 px-2 text-center text-xs">
                                                                    {game.MIN}
                                                                </td>

                                                                {/* Points */}
                                                                <td className="py-2 px-2 text-center text-xs font-semibold">
                                                                    {game.PTS}
                                                                </td>

                                                                {/* Rebounds */}
                                                                <td className="py-2 px-2 text-center text-xs">
                                                                    {game.REB}
                                                                </td>

                                                                {/* Assists */}
                                                                <td className="py-2 px-2 text-center text-xs">
                                                                    {game.AST}
                                                                </td>

                                                                {/* Steals */}
                                                                <td className="py-2 px-2 text-center text-xs">
                                                                    {game.STL}
                                                                </td>

                                                                {/* Blocks */}
                                                                <td className="py-2 px-2 text-center text-xs">
                                                                    {game.BLK}
                                                                </td>

                                                                {/* Turnovers */}
                                                                <td className="py-2 px-2 text-center text-xs">
                                                                    {game.TOV}
                                                                </td>

                                                                {/* Plus/Minus */}
                                                                <td className={`py-2 px-2 text-center text-xs ${game.PLUS_MINUS > 0 ? 'text-green-400' :
                                                                    game.PLUS_MINUS < 0 ? 'text-red-400' : 'text-gray-400'
                                                                    }`}>
                                                                    {game.PLUS_MINUS > 0 ? `+${game.PLUS_MINUS}` : game.PLUS_MINUS}
                                                                </td>

                                                                {/* Rating */}
                                                                <td className="py-2 px-2 text-center">
                                                                    {game.rating !== undefined ? (
                                                                        <div className={`inline-block px-2 py-1 rounded text-xs text-black font-bold ${game.rating >= 7 ? 'bg-[#32c771]' :
                                                                            game.rating >= 5 ? 'bg-orange-500' :
                                                                                game.rating < 5 ? 'bg-red-500' : ''
                                                                            }`}>
                                                                            {game.rating.toFixed(1)}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-500 text-xs">--</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p className="text-white">No game logs available for this season</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Career Stats */}
                    <div className='w-2/5 ml-2'>
                        <div className='mb-2'>
                            <div className="bg-[#1d1d1d] rounded-2xl border-2 border-cyan-700">
                                <div className='border-b-1 w-full border-[#333333]'>
                                    <div className='flex justify-between items-center'>
                                        <h1 className='text-white text-xl ml-7 my-5'>Career</h1>
                                        {seasonRatingsLoading && (
                                            <div className="mr-5 flex items-center">
                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                                <span className="text-xs text-gray-400 ml-2">Loading season ratings...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Season Stats Table - Always Visible */}
                                {rawCareerData ? (
                                    <div className='ml-5 mr-5 pb-5'>
                                        <table className="min-w-full text-white">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="py-3 px-1 text-left w-2/5">SEASON</th>
                                                    <th className="py-3 pl-3 text-left w-1/10">GP</th>
                                                    <th className="py-3 px-2 text-left w-1/10">PTS</th>
                                                    <th className="py-3 px-2 text-left w-1/10">REB</th>
                                                    <th className="py-3 px-2 text-left w-1/10">AST</th>
                                                    <th className="py-3 px-2 text-left w-1/10">RAT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const filteredSeasons = rawCareerData.raw_data
                                                        .filter(row =>
                                                            row.SEASON_ID &&
                                                            row.SEASON_ID.toString().startsWith('2') &&
                                                            row.TEAM_ABBREVIATION !== 'TOT'
                                                        )
                                                        .reverse();

                                                    if (filteredSeasons.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={6} className="py-4 text-center text-gray-400">
                                                                    No season data available
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return filteredSeasons.map((row, index) => {
                                                        const seasonId = row.SEASON_ID.toString();
                                                        const isCurrentSeason = seasonId === '22025' || formatSeasonId(seasonId) === '2025-26';

                                                        let seasonRating;
                                                        let hasRating;

                                                        if (isCurrentSeason && gameLogs && gameLogs.length > 0) {
                                                            // Calculate rating from gameLogs for current season
                                                            const totalRating = gameLogs.reduce((sum, game) => sum + (game.rating || 0), 0);
                                                            seasonRating = totalRating / gameLogs.length;
                                                            hasRating = !isNaN(seasonRating);
                                                        } else {
                                                            // For past seasons, use seasonRatings from API
                                                            seasonRating = seasonRatings[seasonId];
                                                            hasRating = seasonRating !== undefined && !isNaN(seasonRating);
                                                        }

                                                        return (
                                                            <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                                {/* TEAM Column */}
                                                                <td className="py-2 px-1">
                                                                    <div className="flex items-center space-x-2">
                                                                        {/* Team Logo */}
                                                                        <div className="w-5 h-5 flex-shrink-0">
                                                                            <img
                                                                                src={`http://127.0.0.1:5000/api/team-logo/${row.TEAM_ID}`}
                                                                                alt={row.TEAM_ABBREVIATION}
                                                                                className="w-full h-full object-contain"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    const parent = e.currentTarget.parentElement;
                                                                                    if (parent) {
                                                                                        parent.innerHTML = `
                                        <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span class="text-[9px] font-bold text-white">
                                                ${row.TEAM_ABBREVIATION.substring(0, 2)}
                                            </span>
                                        </div>
                                    `;
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        {/* Team and Season */}
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-medium whitespace-nowrap">
                                                                                {getTeamFullName(row.TEAM_ABBREVIATION)}
                                                                            </span>
                                                                            <span className="text-xs text-gray-400">
                                                                                {formatSeasonId(row.SEASON_ID)}
                                                                                {isCurrentSeason}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Games Played */}
                                                                <td className="py-2 px-1">
                                                                    <div className="text-center">
                                                                        <div className="text-xs font-medium">{row.GP}</div>
                                                                    </div>
                                                                </td>

                                                                {/* Points Per Game */}
                                                                <td className="py-2 px-1">
                                                                    <div className="text-center">
                                                                        <div className="text-xs font-medium">
                                                                            {(row.PTS / row.GP).toFixed(1)}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Rebounds Per Game */}
                                                                <td className="py-2 px-1">
                                                                    <div className="text-center">
                                                                        <div className="text-xs font-medium">
                                                                            {(row.REB / row.GP).toFixed(1)}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Assists Per Game */}
                                                                <td className="py-2 px-1">
                                                                    <div className="text-center">
                                                                        <div className="text-xs font-medium">
                                                                            {(row.AST / row.GP).toFixed(1)}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Rating Column */}
                                                                <td className="py-2 px-1">
                                                                    <div className="text-center">
                                                                        {isCurrentSeason && gameLogsLoading ? (
                                                                            <div className="text-gray-500 text-xs">Loading...</div>
                                                                        ) : seasonRatingsLoading && !isCurrentSeason ? (
                                                                            <div className="text-gray-500 text-xs">...</div>
                                                                        ) : hasRating ? (
                                                                            <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${seasonRating >= 8 ? 'bg-purple-500/20 text-purple-400' :
                                                                                seasonRating >= 6 ? 'bg-blue-500/20 text-blue-400' :
                                                                                    seasonRating >= 4 ? 'bg-green-500/20 text-green-400' :
                                                                                        seasonRating >= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                            'bg-red-500/20 text-red-400'
                                                                                }`}>
                                                                                {seasonRating.toFixed(2)}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-gray-500 text-xs">--</div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>

                                        {/* Show summary if we have ratings */}
                                        {Object.keys(seasonRatings).length > 0 && !seasonRatingsLoading && (
                                            <div className="pt-4">
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="text-gray-300">
                                                        Avg Career Rating: <span className="font-bold text-white">
                                                            {(() => {
                                                                // Calculate current season rating from gameLogs
                                                                let currentSeasonRating = 0;
                                                                if (gameLogs && gameLogs.length > 0) {
                                                                    const totalRating = gameLogs.reduce((sum, game) => sum + (game.rating || 0), 0);
                                                                    currentSeasonRating = totalRating / gameLogs.length;
                                                                }

                                                                // Combine with past season ratings
                                                                const pastSeasonRatings = Object.values(seasonRatings);
                                                                const allRatings = [...pastSeasonRatings];

                                                                // Add current season if it's valid
                                                                if (!isNaN(currentSeasonRating) && currentSeasonRating > 0) {
                                                                    allRatings.push(currentSeasonRating);
                                                                }

                                                                // Calculate average
                                                                if (allRatings.length > 0) {
                                                                    const total = allRatings.reduce((a, b) => a + b, 0);
                                                                    return (total / allRatings.length).toFixed(2);
                                                                }

                                                                return '--';
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        Loading career stats...
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='bg-[#1d1d1d] rounded-2xl border-1 border-orange-400'>
                            <div className='w-full border-b-1 border-[#333333] h-10 flex flex-row items-center p-3'>
                                <img
                                    src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7"
                                    alt="NBA"
                                    className="w-6 h-6 mr-1.5"
                                />
                                <h2 className='text-white text-sm'>Stat Percentiles 2025-26</h2>
                            </div>
                            <PlayerProfilePercentiles
                                allRankingStats={allRankingStats}
                                allStatsLoading={allStatsLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}