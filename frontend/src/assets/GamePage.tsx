import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo } from "react";
import type { Stats, Player } from './components/types/index.ts';
import { NBAService, type NBAGame, type NBATeamStats, type FullScheduleGame } from '../api/nbaService';
import GameHeader from './components/GameHeader';
import FactsTab from './components/tabs/FactsTab';
import LineupTab from './components/tabs/LineupTab';
import TableTab from './components/tabs/TableTab';
import StatsTab from './components/tabs/StatsTab';
import PlayerCard from './components/PlayerCard';
import FutureGameView, { type TabType as FutureTabType, formatGameTime } from './FutureGameView';
import { calculatePlayerRating } from '../utils/teamMappings.ts';

export default function GamePage() {
    const [gameStats, setGameStats] = useState<Stats[]>([]);
    const [nbaGames, setNbaGames] = useState<NBAGame[]>([]);
    const [futureGame, setFutureGame] = useState<FullScheduleGame | null>(null);
    const [isFutureGame, setIsFutureGame] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'facts' | 'lineup' | 'table' | 'stats'>('facts');
    const [futureActiveTab, setFutureActiveTab] = useState<FutureTabType>('preview');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(-1);
    const playerCardRef = useRef<HTMLDivElement>(null);

    const { date, id } = useParams<{ date?: string; id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [teamsThisGame, setTeamsThisGame] = useState<Array<{ team_id: number, team_name: string, points: number }>>([]);
    const [teamStats, setTeamStats] = useState<NBATeamStats[]>([]);

    const futureTabs = [
        { key: 'preview', label: 'Preview' },
        { key: 'table', label: 'Table' },
        { key: 'stats', label: 'Stats' }
    ];


    // Check if this is a future game and load appropriate data
    useEffect(() => {
        const loadGameData = async () => {
            try {
                setLoading(true);

                // First try to load from past games
                const pastGamesData = await NBAService.fetchGames();
                const pastGame = pastGamesData.games.find(game => game.game_id === id);

                if (pastGame) {
                    // This is a past game - load normally
                    console.log('Past game found:', pastGame);
                    setIsFutureGame(false);
                    setNbaGames([pastGame]);

                    // Set teams for this game
                    const gameTeams = pastGame.teams.map(team => ({
                        team_id: team.team_id,
                        team_name: team.team_name,
                        points: team.pts
                    }));
                    setTeamsThisGame(gameTeams);
                    setTeamStats(pastGame.teams);

                    // Convert NBA game data to Stats format
                    const convertedStats = await convertNBAGameToStats(pastGame);
                    setGameStats(convertedStats);

                    if (convertedStats.length === 0) {
                        console.log('No player stats available for this game');
                    }
                } else {
                    // Try future games
                    const futureData = await NBAService.fetchFullSchedule();
                    const futureGameData = futureData.games.find(game => game.gameId === id);

                    if (futureGameData) {
                        // This is a future game
                        console.log('Future game found:', futureGameData);
                        setIsFutureGame(true);
                        setFutureGame(futureGameData);

                        // Set basic team info for future game
                        setTeamsThisGame([
                            {
                                team_id: futureGameData.homeTeam_teamId,
                                team_name: futureGameData.homeTeam_teamName,
                                points: 0
                            },
                            {
                                team_id: futureGameData.awayTeam_teamId,
                                team_name: futureGameData.awayTeam_teamName,
                                points: 0
                            }
                        ]);
                    } else {
                        setError('Game not found');
                    }
                }
            } catch (err) {
                console.error('Error loading game data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load game');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadGameData();
        }
    }, [id]);

    // Convert NBA game data to your Stats format
    const convertNBAGameToStats = async (game: NBAGame): Promise<Stats[]> => {
        console.log('Converting NBA game to stats for game:', game.game_id);

        try {
            const apiUrl = `http://127.0.0.1:5000/api/game/${game.game_id}/simple-boxscore`;
            console.log('Fetching from API:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('API Response status:', response.status, response.statusText);

            if (response.ok) {
                const boxScoreData = await response.json();
                console.log('Box score data received:', boxScoreData);

                if (boxScoreData.success && boxScoreData.players?.length > 0) {
                    console.log('Box score success! Player count:', boxScoreData.players.length);

                    // Convert box score players to Stats format
                    const stats = boxScoreData.players.map((player: any) => {
                        // Calculate missed shots for rating calculation
                        const fg_missed = Math.max(0, (player.fg_attempted || 0) - (player.fg_made || 0));
                        const ft_missed = Math.max(0, (player.ft_attempted || 0) - (player.ft_made || 0));

                        return {
                            player_id: player.player_id,
                            player_name: player.name,
                            player_name_short: player.name.split(' ').map((n: string) => n[0]).join(''),
                            position: player.position || '',
                            position_sort: getPositionSort(player.position || ''),
                            game_id: parseInt(game.game_id),
                            team_id: player.team_id,
                            minutes: convertMinutesToDecimal(player.minutes),
                            points: player.points || 0,
                            fg_made: player.fg_made || 0,
                            fg_attempted: player.fg_attempted || 0,
                            fg_percentage: player.fg_percentage || 0,
                            three_pt_made: player.three_made || 0,
                            three_pt_attempted: player.three_attempted || 0,
                            three_pt_percentage: player.three_percentage || 0,
                            ft_made: player.ft_made || 0,
                            ft_attempted: player.ft_attempted || 0,
                            ft_percentage: player.ft_percentage || 0,
                            offensive_rebounds: 0,
                            defensive_rebounds: 0,
                            total_rebounds: player.rebounds || 0,
                            assists: player.assists || 0,
                            steals: player.steals || 0,
                            blocks: player.blocks || 0,
                            turnovers: player.turnovers || 0,
                            personal_fouls: player.fouls || 0,
                            technical_fouls: 0,
                            ejected: 0,
                            ortg: 0,
                            usg: 0,
                            url: '',
                            jersey: player.jersey || '',
                            plus_minus: player.plus_minus || 0,
                            player_rating: calculatePlayerRating({
                                points: player.points || 0,
                                assists: player.assists || 0,
                                rebounds: player.rebounds || 0,
                                steals: player.steals || 0,
                                blocks: player.blocks || 0,
                                turnovers: player.turnovers || 0,
                                fouls: player.fouls || 0,
                                fg_made: player.fg_made || 0,
                                fg_missed: player.fg_missed || 0,
                                three_made: player.three_made || 0,
                                ft_made: player.ft_made || 0,
                                ft_attempted: player.ft_attempted || 0,
                                ft_missed: player.ft_missed || 0,
                                ejections: 0
                            })
                        };
                    });

                    console.log('Converted stats count:', stats.length);
                    return stats;
                } else {
                    console.log('Box score API returned no players or success: false');
                    return [];
                }
            } else {
                console.log('API response not OK:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error fetching box score:', error);
            return [];
        }
    };

    // Helper function to convert minutes from "MM:SS" to decimal
    const convertMinutesToDecimal = (minutes: string): number => {
        if (!minutes) return 0;
        const parts = minutes.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) + (parseInt(parts[1]) / 60);
        }
        return 0;
    };

    // Helper function to get position sort order
    const getPositionSort = (position: string): number => {
        const positionOrder: Record<string, number> = {
            'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5
        };
        return positionOrder[position] || 6;
    };

    const getStatsForTeams = () => {
        if (!id || !teamsThisGame.length || !gameStats.length) {
            return { Team1: [], Team2: [], Team1All: null, Team2All: null };
        }

        const statsPerTeam = gameStats.filter(g => g.game_id === Number(id));

        const Team1 = statsPerTeam.filter(s => s.team_id === teamsThisGame[0].team_id);
        const Team2 = statsPerTeam.filter(s => s.team_id === teamsThisGame[1].team_id);

        const Team1All = teamStats.find((t: NBATeamStats) => t.team_id === teamsThisGame[0].team_id);
        const Team2All = teamStats.find((t: NBATeamStats) => t.team_id === teamsThisGame[1].team_id);

        const convertTeamStats = (team: NBATeamStats | undefined) => {
            if (!team) return null;

            return {
                player_id: 0,
                player_name: team.team_name,
                player_name_short: team.team_abbreviation,
                position: 'TM',
                position_sort: 0,
                game_id: Number(id),
                minutes: 240,
                points: team.pts,
                fg_made: team.fgm,
                fg_attempted: team.fga,
                fg_percentage: team.fg_pct,
                three_pt_made: team.fg3m,
                three_pt_attempted: team.fg3a,
                three_pt_percentage: team.fg3_pct,
                ft_made: team.ftm,
                ft_attempted: team.fta,
                ft_percentage: team.ft_pct,
                offensive_rebounds: team.oreb,
                defensive_rebounds: team.dreb,
                total_rebounds: team.reb,
                assists: team.ast,
                steals: team.stl,
                blocks: team.blk,
                turnovers: team.tov,
                personal_fouls: team.pf,
                technical_fouls: 0,
                ejected: 0,
                ortg: 0,
                usg: 0,
                url: '',
                player_rating: 0,
                ...team
            } as Stats & NBATeamStats;
        };

        return {
            Team1,
            Team2,
            Team1All: convertTeamStats(Team1All),
            Team2All: convertTeamStats(Team2All)
        };
    };

    const allPlayers = useMemo(() => {
        if (!gameStats.length || !teamsThisGame.length) return [];

        const { Team1, Team2 } = getStatsForTeams();
        const players: Player[] = [];

        Team1.forEach(stat => {
            players.push({
                player_id: stat.player_id,
                player_name: stat.player_name,
                number: stat.player_name_short || String(stat.player_id),
                position: stat.position,
                x: 0,
                y: 0,
                team_id: stat.team_id,
                stats: {
                    minutes: stat.minutes,
                    points: stat.points,
                    fg_made: stat.fg_made,
                    fg_attempted: stat.fg_attempted,
                    fg_percentage: stat.fg_percentage,
                    three_pt_made: stat.three_pt_made,
                    three_pt_attempted: stat.three_pt_attempted,
                    three_pt_percentage: stat.three_pt_percentage,
                    ft_made: stat.ft_made,
                    ft_attempted: stat.ft_attempted,
                    ft_percentage: stat.ft_percentage,
                    offensive_rebounds: stat.offensive_rebounds,
                    defensive_rebounds: stat.defensive_rebounds,
                    total_rebounds: stat.total_rebounds,
                    assists: stat.assists,
                    steals: stat.steals,
                    blocks: stat.blocks,
                    turnovers: stat.turnovers,
                    personal_fouls: stat.personal_fouls,
                    technical_fouls: stat.technical_fouls,
                    ejected: stat.ejected,
                    ortg: stat.ortg,
                    usg: stat.usg,
                    url: stat.url,
                    player_rating: stat.player_rating,
                }
            });
        });

        Team2.forEach(stat => {
            players.push({
                player_id: stat.player_id,
                player_name: stat.player_name,
                number: stat.player_name_short || String(stat.player_id),
                position: stat.position,
                x: 0,
                y: 0,
                team_id: stat.team_id,
                stats: {
                    minutes: stat.minutes,
                    points: stat.points,
                    fg_made: stat.fg_made,
                    fg_attempted: stat.fg_attempted,
                    fg_percentage: stat.fg_percentage,
                    three_pt_made: stat.three_pt_made,
                    three_pt_attempted: stat.three_pt_attempted,
                    three_pt_percentage: stat.three_pt_percentage,
                    ft_made: stat.ft_made,
                    ft_attempted: stat.ft_attempted,
                    ft_percentage: stat.ft_percentage,
                    offensive_rebounds: stat.offensive_rebounds,
                    defensive_rebounds: stat.defensive_rebounds,
                    total_rebounds: stat.total_rebounds,
                    assists: stat.assists,
                    steals: stat.steals,
                    blocks: stat.blocks,
                    turnovers: stat.turnovers,
                    personal_fouls: stat.personal_fouls,
                    technical_fouls: stat.technical_fouls,
                    ejected: stat.ejected,
                    ortg: stat.ortg,
                    usg: stat.usg,
                    url: stat.url,
                    player_rating: stat.player_rating,
                }
            });
        });

        return players;
    }, [gameStats, teamsThisGame, id]);

    const handleNext = () => {
        if (allPlayers.length === 0) return;

        const nextIndex = (currentPlayerIndex + 1) % allPlayers.length;
        setCurrentPlayerIndex(nextIndex);
        setSelectedPlayer(allPlayers[nextIndex]);
    };

    const handlePrevious = () => {
        if (allPlayers.length === 0) return;

        const prevIndex = (currentPlayerIndex - 1 + allPlayers.length) % allPlayers.length;
        setCurrentPlayerIndex(prevIndex);
        setSelectedPlayer(allPlayers[prevIndex]);
    };

    const handlePlayerClick = (player: Player) => {
        const index = allPlayers.findIndex(p => p.player_id === player.player_id);
        setCurrentPlayerIndex(index);
        setSelectedPlayer(player);
    };

    const handleClosePlayerCard = () => {
        setSelectedPlayer(null);
        setCurrentPlayerIndex(-1);
    };

    const hasNext = allPlayers.length > 0;
    const hasPrevious = allPlayers.length > 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (playerCardRef.current && !playerCardRef.current.contains(event.target as Node)) {
                setSelectedPlayer(null);
            }
        };

        if (selectedPlayer) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [selectedPlayer]);

    const formatDateForURL = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleBack = () => {
        if (date) {
            navigate(`/${date}`);
        } else {
            const today = new Date();
            const todayString = formatDateForURL(today);
            navigate(`/${todayString}`);
        }
    };

    const handleFutureTabClick = (tabKey: FutureTabType, index: number) => {
        setFutureActiveTab(tabKey);
    };

    const renderFutureTabContent = () => {
        if (!futureGame) return null;

        switch (futureActiveTab) {
            case 'preview':
                return (
                    <div className="p-6 text-white">
                        <h3 className="text-lg font-semibold mb-4">Game Preview</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Season</p>
                                <p className="text-white font-semibold">{futureGame.seasonYear || '2025-26'}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Game Time</p>
                                <p className="text-white font-semibold">{formatGameTime(futureGame.gameTimeEst)}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Arena</p>
                                <p className="text-white font-semibold">{futureGame.arenaName || 'TBD'}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Location</p>
                                <p className="text-white font-semibold">{futureGame.arenaCity || ''} {futureGame.arenaState || ''}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Arena</p>
                                <p className="text-white font-semibold">{futureGame.arenaName || 'TBD'}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Location</p>
                                <p className="text-white font-semibold">{futureGame.arenaCity || ''} {futureGame.arenaState || ''}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'table':
                return (
                    <div className="p-6 text-white">
                        <h3 className="text-lg font-semibold mb-4">Season Stats Comparison</h3>
                        <div className="flex justify-around">
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">{futureGame.homeTeam_teamName}</p>
                                <p className="text-white font-bold text-xl">{futureGame.homeTeam_wins} - {futureGame.homeTeam_losses}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">{futureGame.awayTeam_teamName}</p>
                                <p className="text-white font-bold text-xl">{futureGame.awayTeam_wins} - {futureGame.awayTeam_losses}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'stats':
                return (
                    <div className="p-6 text-white">
                        <h3 className="text-lg font-semibold mb-4">Team Statistics</h3>
                        <p className="text-gray-400">Advanced statistics will be available closer to game time.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderTabContent = () => {
        if (loading) {
            return (
                <div className="text-white text-center py-8">
                    <div className="spinner"></div>
                    <p>Loading game data...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-white text-center py-8">
                    <div className="text-red-400">Error: {error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!teamsThisGame.length) {
            return (
                <div className="text-white text-center py-8">
                    <div className="text-yellow-400">No game data available</div>
                    <p className="mt-2">The game you're looking for might not exist or data is unavailable.</p>
                </div>
            );
        }

        // If this is a future game, return null (FutureGameView will handle its own content)
        if (isFutureGame) {
            return null;
        }

        // Otherwise show regular game tabs for past games
        const { Team1, Team2, Team1All, Team2All } = getStatsForTeams();

        if (activeTab === 'lineup' && Team1.length === 0 && Team2.length === 0) {
            return (
                <div className="text-white text-center py-8">
                    <div className="text-yellow-400">Player statistics not available</div>
                    <p className="mt-2">Box score data is not available for this game.</p>
                    <p className="mt-1">Try another game or check back later.</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'facts':
                return <FactsTab Team1All={Team1All} Team2All={Team2All} />;
            case 'lineup':
                return <LineupTab
                    Team1={Team1}
                    Team2={Team2}
                    team1Id={teamsThisGame[0].team_id}
                    team2Id={teamsThisGame[1].team_id}
                    onPlayerClick={handlePlayerClick}
                />;
            case 'table':
                return <TableTab
                    team1Id={teamsThisGame[0].team_id}
                    team2Id={teamsThisGame[1].team_id} />;
            case 'stats':
                return <StatsTab />;
            default:
                return <FactsTab Team1All={Team1All} Team2All={Team2All} />;
        }
    };

    if (loading && !gameStats.length && !futureGame) {
        return (
            <div className="text-white text-center py-8">
                <div className="spinner"></div>
                <p>Loading NBA game data...</p>
            </div>
        );
    }

    // If it's a future game, use FutureGameView with its own tabs
    if (isFutureGame && futureGame) {
        return (
            <>
                <div className='w-full flex flex-row justify-center'>
                    <div className='w-2/3 min-h-[80vh]'>
                        <GameHeader
                            date={date}
                            teamsThisGame={teamsThisGame}
                            onBack={handleBack}
                            activeTab={futureActiveTab}
                            onTabClick={(tabKey, index) => setFutureActiveTab(tabKey)}
                            isFutureGame={true}
                            tabs={futureTabs} // Pass custom tabs
                        />

                        <div className='flex mt-5 border-2 border-blue-400 mr-5 min-h-[20vh] rounded-2xl bg-[#1d1d1d] flex-col'>
                            {renderFutureTabContent()}
                        </div>
                    </div>

                    <div className='border-2 border-amber-400 w-1/5 mt-25 rounded-2xl bg-[#1d1d1d]'></div>
                </div>
            </>
        );
    }

    // For past games, use the existing layout with tabs
    return (
        <>
            <div className='w-full flex flex-row justify-center'>
                <div className='w-2/3 min-h-[80vh]'>
                    <GameHeader
                        date={date}
                        teamsThisGame={teamsThisGame}
                        onBack={handleBack}
                        activeTab={activeTab}
                        onTabClick={(tabKey, index) => setActiveTab(tabKey)}
                        isFutureGame={isFutureGame}
                    />

                    <div className='flex mt-5 border-2 border-blue-400 mr-5 min-h-[20vh] rounded-2xl bg-[#1d1d1d] flex-col'>
                        {renderTabContent()}
                    </div>
                </div>

                <div className='border-2 border-amber-400 w-1/5 mt-25 rounded-2xl bg-[#1d1d1d]'></div>
            </div>

            {/* PlayerCard with navigation */}
            <PlayerCard
                player={selectedPlayer}
                onClose={handleClosePlayerCard}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                currentIndex={currentPlayerIndex}
                totalPlayers={allPlayers.length}
            />
        </>
    );
}