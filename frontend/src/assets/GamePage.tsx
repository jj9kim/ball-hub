import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo } from "react";
import type { Stats, TabType, Player } from './components/types/index.ts';
import GameHeader from './components/GameHeader';
import FactsTab from './components/tabs/FactsTab';
import LineupTab from './components/tabs/LineupTab';
import TableTab from './components/tabs/TableTab';
import StatsTab from './components/tabs/StatsTab';
import PlayerCard from './components/PlayerCard';

export default function GamePage() {
    const [gameStats, setGameStats] = useState<Stats[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('facts');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(-1);
    const playerCardRef = useRef<HTMLDivElement>(null);

    const { date, id } = useParams<{ date?: string; id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const teamsThisGame = location.state.teamsThisGame;
    const teamStats = location.state.t;

    // Move getStatsForTeams inside the component
    const getStatsForTeams = () => {
        const statsPerTeam = gameStats.filter(g => g.game_id === Number(id));
        const Team1 = statsPerTeam.filter(s => s.team_id === teamsThisGame[0].team_id)
        const Team2 = statsPerTeam.filter(s => s.team_id === teamsThisGame[1].team_id)

        const allStats = teamStats.filter((s: Stats) => s.game_id === Number(id));
        const Team1All = allStats.find((g: Stats) => g.team_id === teamsThisGame[0].team_id);
        const Team2All = allStats.find((g: Stats) => g.team_id === teamsThisGame[1].team_id);

        function sumField(arr: any[], field: string): number {
            return arr.reduce((sum, obj) => sum + (obj[field] || 0), 0);
        }

        if (Team1All) {
            Team1All.fg_attempted = sumField(Team1, "fg_attempted");
            Team1All.fg_made = sumField(Team1, "fg_made");
            Team1All.ft_attempted = sumField(Team1, "ft_attempted");
            Team1All.ft_made = sumField(Team1, "ft_made");
            Team1All.three_pt_attempted = sumField(Team1, "three_pt_attempted");
            Team1All.three_pt_made = sumField(Team1, "three_pt_made");
        }

        if (Team2All) {
            Team2All.fg_attempted = sumField(Team2, "fg_attempted");
            Team2All.fg_made = sumField(Team2, "fg_made");
            Team2All.ft_attempted = sumField(Team2, "ft_attempted");
            Team2All.ft_made = sumField(Team2, "ft_made");
            Team2All.three_pt_attempted = sumField(Team2, "three_pt_attempted");
            Team2All.three_pt_made = sumField(Team2, "three_pt_made");
        }

        return { Team1, Team2, Team1All, Team2All }
    }

    // Combine all players from both teams
    const allPlayers = useMemo(() => {
        if (!gameStats.length || !teamsThisGame) return [];

        const { Team1, Team2 } = getStatsForTeams();
        const players: Player[] = [];

        // Convert Team1 stats to Player objects
        Team1.forEach(stat => {
            players.push({
                player_id: stat.player_id,
                player_name: stat.player_name,
                number: String(stat.player_id), // You might want to adjust this
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
                number: String(stat.player_id), // You might want to adjust this
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
    }, [gameStats, teamsThisGame, teamStats, id]);

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

    useEffect(() => {
        fetch('http://localhost:8081/games')
            .then(res => res.json())
            .then((gameStats: Stats[]) => setGameStats(gameStats))
            .catch(err => console.log(err));
    }, []);

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