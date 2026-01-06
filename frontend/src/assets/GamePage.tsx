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
                setNbaGames(data.games);

                // Find the specific game by ID
                const currentGame = data.games.find(game => game.game_id === id);

                if (currentGame) {
                    // Set teams for this game
                    const gameTeams = currentGame.teams.map(team => ({
                        team_id: team.team_id,
                        team_name: team.team_name,
                        points: team.pts
                    }));
                    setTeamsThisGame(gameTeams);
                    setTeamStats(currentGame.teams);

                    // Convert NBA game data to your Stats format
                    const convertedStats = await convertNBAGameToStats(currentGame);
                    setGameStats(convertedStats);
                } else {
                    setError('Game not found');
                }

                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load NBA games');
                console.error('Error loading NBA games:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadNBAGames();
        }
    }, [id]);

    // Convert NBA game data to your Stats format
    const convertNBAGameToStats = async (game: NBAGame): Promise<Stats[]> => {
        // Since NBA API only provides team stats, we need to get player stats separately
        // Let's fetch box score data for player stats
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/game/${game.game_id}/simple-boxscore`);
            const boxScoreData = await response.json();

            if (boxScoreData.success) {
                // Convert box score players to Stats format
                return boxScoreData.players.map((player: any) => ({
                    player_id: player.player_id,
                    player_name: player.name,
                    player_name_short: player.name.split(' ').map((n: string) => n[0]).join(''),
                    position: player.position,
                    position_sort: getPositionSort(player.position),
                    game_id: parseInt(game.game_id),
                    team_id: player.team_id,
                    minutes: convertMinutesToDecimal(player.minutes),
                    points: player.points,
                    fg_made: player.fg_made,
                    fg_attempted: player.fg_attempted,
                    fg_percentage: player.fg_percentage,
                    three_pt_made: player.three_made,
                    three_pt_attempted: player.three_attempted,
                    three_pt_percentage: player.three_percentage,
                    ft_made: player.ft_made,
                    ft_attempted: player.ft_attempted,
                    ft_percentage: player.ft_percentage,
                    offensive_rebounds: 0, // Not available in simple box score
                    defensive_rebounds: 0, // Not available in simple box score
                    total_rebounds: player.rebounds,
                    assists: player.assists,
                    steals: player.steals,
                    blocks: player.blocks,
                    turnovers: player.turnovers,
                    personal_fouls: player.fouls,
                    technical_fouls: 0,
                    ejected: 0,
                    ortg: 0,
                    usg: 0,
                    url: '',
                    player_rating: calculatePlayerRating(player)
                }));
            }
        } catch (error) {
            console.error('Error fetching box score:', error);
        }

        // Fallback: If no box score, return empty array
        return [];
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
            'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5, 'G': 6, 'F': 7
        };
        return positionOrder[position] || 8;
    };

    // Helper function to calculate player rating
    const calculatePlayerRating = (player: any): number => {
        let rating = player.points * 1.0;
        rating += player.rebounds * 1.2;
        rating += player.assists * 1.5;
        rating += player.steals * 3.0;
        rating += player.blocks * 3.0;
        rating -= player.turnovers * 2.0;
        rating += player.plus_minus * 0.5;

        if (player.fg_attempted > 0) {
            rating += (player.fg_percentage - 0.45) * 100;
        }
        if (player.three_attempted > 0) {
            rating += (player.three_percentage - 0.35) * 100;
        }

        return Math.round(rating * 10) / 10;
    };

    // Move getStatsForTeams inside the component
    const getStatsForTeams = () => {
        if (!id || !teamsThisGame.length) {
            return { Team1: [], Team2: [], Team1All: null, Team2All: null };
        }

        const statsPerTeam = gameStats.filter(g => g.game_id === Number(id));
        const Team1 = statsPerTeam.filter(s => s.team_id === teamsThisGame[0].team_id);
        const Team2 = statsPerTeam.filter(s => s.team_id === teamsThisGame[1].team_id);

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
                    Loading game data...
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-white text-center py-8">
                    Error: {error}
                </div>
            );
        }

        if (!teamsThisGame.length) {
            return (
                <div className="text-white text-center py-8">
                    No game data available
                </div>
            );
        }

        const { Team1, Team2, Team1All, Team2All } = getStatsForTeams();

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