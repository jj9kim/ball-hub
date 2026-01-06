import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo } from "react";
import type { Stats, TabType, Player } from './components/types/index.ts';
import { NBAService, type NBAGame, type NBATeamStats } from '../api/nbaService';
import GameHeader from './components/GameHeader';
import FactsTab from './components/tabs/FactsTab';
import LineupTab from './components/tabs/LineupTab';
import TableTab from './components/tabs/TableTab';
import StatsTab from './components/tabs/StatsTab';
import PlayerCard from './components/PlayerCard';

export default function GamePage() {
    const [gameStats, setGameStats] = useState<Stats[]>([]);
    const [nbaGames, setNbaGames] = useState<NBAGame[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('facts');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(-1);
    const playerCardRef = useRef<HTMLDivElement>(null);

    const { date, id } = useParams<{ date?: string; id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Get game data from NBA API instead of location.state
    const [teamsThisGame, setTeamsThisGame] = useState<Array<{ team_id: number, team_name: string, points: number }>>([]);
    const [teamStats, setTeamStats] = useState<NBATeamStats[]>([]);

    // Fetch NBA games data
    useEffect(() => {
        const loadNBAGames = async () => {
            try {
                setLoading(true);
                const data = await NBAService.fetchGames();
                console.log('NBA games loaded:', data.games?.length || 0);
                setNbaGames(data.games);

                // Find the specific game by ID
                const currentGame = data.games.find(game => game.game_id === id);
                console.log('Current game found:', currentGame);

                if (currentGame) {
                    // Set teams for this game
                    const gameTeams = currentGame.teams.map(team => ({
                        team_id: team.team_id,
                        team_name: team.team_name,
                        points: team.pts
                    }));
                    console.log('Setting teamsThisGame:', gameTeams);
                    setTeamsThisGame(gameTeams);
                    setTeamStats(currentGame.teams);

                    // Convert NBA game data to your Stats format
                    const convertedStats = await convertNBAGameToStats(currentGame);
                    console.log('Setting gameStats with:', convertedStats.length, 'players');

                    if (convertedStats.length === 0) {
                        console.log('No player stats available for this game');
                        // You could set a user-friendly error message here
                        setError('Player statistics not available for this game');
                    }

                    setGameStats(convertedStats);
                } else {
                    console.log('Game not found for id:', id);
                    setError('Game not found');
                }

                setError(null);
            } catch (err) {
                console.error('Error loading NBA games:', err);
                setError(err instanceof Error ? err.message : 'Failed to load NBA games');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            console.log('Loading NBA games for id:', id);
            loadNBAGames();
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
                            offensive_rebounds: 0, // Not in simple API
                            defensive_rebounds: 0, // Not in simple API
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
                    // Return empty array instead of mock data
                    return [];
                }
            } else {
                console.log('API response not OK:', response.status);
                // Return empty array instead of mock data
                return [];
            }
        } catch (error) {
            console.error('Error fetching box score:', error);
            // Return empty array instead of mock data
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

    // Helper function to calculate player rating
    const calculatePlayerRating = (player: any): number => {
        let tdd = 0, rdd = 0, add = 0, foulrating = 0;        
        
        if (player.points > 10 && player.assists > 10 && player.rebounds > 10) {
            tdd = 1.24;
        } else if (player.points > 10 && player.rebounds > 10) {
            rdd = 0.38;
        } else if (player.points > 10 && player.assists > 10) {
            add = 0.44;
        }

        if (player.fouls > 5) {
            foulrating = 2;
        } else {
            foulrating = ((0.3 * Math.log(player.fouls + 1)) + 0.05 * player.fouls);
        }


        let rating = ((0.17 * Math.log(player.points + 1)) + (0.02 * player.points)) +
            ((0.33 * Math.log(player.assists + 1)) + (0.06 * player.assists)) +
            ((0.14 * Math.log(player.rebounds + 1)) + (0.02 * player.rebounds)) +
            ((0.37 * Math.log(player.steals + 1)) + (0.06 * player.steals)) +
            ((0.34 * Math.log(player.blocks + 1)) + (0.05 * player.blocks)) -
            ((0.45 * Math.log(player.turnovers + 1)) + (0.03 * player.turnovers)) -
            foulrating +
            ((0.11 * Math.log(player.fg_made + 1)) + (0.02 * player.fg_made)) -
            ((0.12 * Math.log(player.fg_missed + 1)) + (0.03 * player.fg_missed)) +
            ((0.11 * Math.log(player.three_made + 1)) + (0.03 * player.three_made)) +
            ((0.01 * Math.log(player.ft_attempted + 1))) +
            ((0.04 * Math.log(player.ft_made + 1)) + (0.005 * player.ft_made)) -
            ((0.07 * Math.log(player.ft_missed + 1)) + (0.02 * player.ft_missed)) -
            ((2.5 * Math.log(player.ejections + 1))) +
            tdd +
            rdd +
            add

        rating = Math.max(0, Math.min(10, (6 + rating)));

        return Number(rating.toFixed(2));
    };

    // Move getStatsForTeams inside the component
    const getStatsForTeams = () => {
        console.log('getStatsForTeams called with:', {
            id,
            teamsThisGame,
            gameStatsLength: gameStats.length
        });

        if (!id || !teamsThisGame.length) {
            console.log('Missing id or teamsThisGame');
            return { Team1: [], Team2: [], Team1All: null, Team2All: null };
        }

        const statsPerTeam = gameStats.filter(g => g.game_id === Number(id));
        console.log('statsPerTeam filtered:', statsPerTeam.length);

        // Log the team_ids we're looking for
        console.log('Looking for team IDs:', {
            team1Id: teamsThisGame[0]?.team_id,
            team2Id: teamsThisGame[1]?.team_id
        });

        const Team1 = statsPerTeam.filter(s => s.team_id === teamsThisGame[0].team_id);
        const Team2 = statsPerTeam.filter(s => s.team_id === teamsThisGame[1].team_id);

        console.log('Filtered results:', {
            Team1Count: Team1.length,
            Team2Count: Team2.length
        });

        // Create team totals from teamStats
        const Team1All = teamStats.find((t: NBATeamStats) => t.team_id === teamsThisGame[0].team_id);
        const Team2All = teamStats.find((t: NBATeamStats) => t.team_id === teamsThisGame[1].team_id);

        // Convert NBATeamStats to your Stats format for compatibility
        const convertTeamStats = (team: NBATeamStats | undefined) => {
            if (!team) return null;

            return {
                player_id: 0,
                player_name: team.team_name,
                player_name_short: team.team_abbreviation,
                position: 'TM',
                position_sort: 0,
                game_id: Number(id),
                minutes: 240, // Full game
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

    // Combine all players from both teams
    const allPlayers = useMemo(() => {
        if (!gameStats.length || !teamsThisGame.length) return [];

        const { Team1, Team2 } = getStatsForTeams();
        const players: Player[] = [];

        // Convert Team1 stats to Player objects
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

        // Convert Team2 stats to Player objects
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

    // Navigation states
    const hasNext = allPlayers.length > 0;
    const hasPrevious = allPlayers.length > 0;

    // Handle click outside to close PlayerCard
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

    const handleTabClick = (tabKey: TabType, index: number) => {
        setActiveTab(tabKey);
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

        const { Team1, Team2, Team1All, Team2All } = getStatsForTeams();

        // Check if we have player data for the lineup tab
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

    if (loading && !gameStats.length) {
        return (
            <div className="text-white text-center py-8">
                <div className="spinner"></div>
                <p>Loading NBA game data...</p>
            </div>
        );
    }

    return (
        <>
            <div className='w-full flex flex-row justify-center'>
                <div className='w-2/3 min-h-[80vh]'>
                    <GameHeader
                        date={date}
                        teamsThisGame={teamsThisGame}
                        onBack={handleBack}
                        activeTab={activeTab}
                        onTabClick={handleTabClick}
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