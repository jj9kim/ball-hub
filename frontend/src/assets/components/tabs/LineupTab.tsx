import { useState } from 'react';
import type { Player, Stats } from '../types/index.ts';
import PlayerIndicator from '../PlayerIndicator';
import PlayerCard from '../PlayerCard';

interface LineupTabProps {
    Team1: Stats[];
    Team2: Stats[];
    onPlayerClick: (player: Player) => void;
}
// Sample player data - replace with your actual data
const samplePlayers: Player[] = [
    {
        id: 1,
        name: "Stephen Curry",
        number: "30",
        position: "PG",
        x: 42,
        y: 60,
        team: 'home',
        photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png",
        stats: {
            points: 28,
            total_rebounds: 5,
            assists: 7,
            steals: 2,
            blocks: 0,
            minutes: 36,
            player_rating: 4.8
        }
    },
    {
        id: 2,
        name: "Klay Thompson",
        number: "11",
        position: "SG",
        x: 32,
        y: 95,
        team: 'home',
        stats: {
            points: 22,
            total_rebounds: 4,
            assists: 3,
            steals: 1,
            blocks: 1,
            minutes: 32,
            player_rating: 4.2
        }
    },
    {
        id: 3,
        name: "Anthony Edwards",
        number: "5",
        position: "SG",
        x: 68,
        y: 25,
        team: 'away',
        photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png",
        stats: {
            points: 24,
            total_rebounds: 6,
            assists: 4,
            steals: 2,
            blocks: 1,
            minutes: 34,
            player_rating: 4.5
        }
    },
    {
        id: 4,
        name: "Rudy Gobert",
        number: "20",
        position: "C",
        x: 90,
        y: 72,
        team: 'away',
        stats: {
            points: 12,
            total_rebounds: 11,
            assists: 1,
            steals: 1,
            blocks: 4,
            minutes: 33,
            player_rating: 4.3
        }
    },
    {
        id: 5,
        name: "Draymond Green",
        number: "23",
        position: "C",
        x: 10,
        y: 50,
        team: 'home',
        stats: {
            points: 7,
            total_rebounds: 6,
            assists: 5,
            steals: 1,
            blocks: 2,
            minutes: 33,
            player_rating: 4.1
        }
    },
    {
        id: 6,
        name: "Jimmy Butler",
        number: "10",
        position: "SF",
        x: 27,
        y: 27,
        team: 'home',
        stats: {
            points: 19,
            total_rebounds: 6,
            assists: 4,
            steals: 3,
            blocks: 0,
            minutes: 37,
            player_rating: 4.8
        }
    },
    {
        id: 7,
        name: "Jonathan Kuminga",
        number: "00",
        position: "PF",
        x: 10,
        y: 85,
        team: 'home',
        stats: {
            points: 15,
            total_rebounds: 5,
            assists: 2,
            steals: 0,
            blocks: 1,
            minutes: 30,
            player_rating: 4.2
        }
    },
    {
        id: 8,
        name: "Jaden McDaniels",
        number: "1",
        position: "SF",
        x: 73,
        y: 95,
        team: 'away',
        stats: {
            points: 21,
            total_rebounds: 11,
            assists: 3,
            steals: 1,
            blocks: 2,
            minutes: 33,
            player_rating: 4.3
        }
    },
    {
        id: 8,
        name: "Mike Conley",
        number: "7",
        position: "PG",
        x: 58,
        y: 60,
        team: 'away',
        stats: {
            points: 21,
            total_rebounds: 11,
            assists: 3,
            steals: 1,
            blocks: 2,
            minutes: 33,
            player_rating: 4.3
        }
    },
    {
        id: 8,
        name: "Karl-Anthony Towns",
        number: "32",
        position: "PF",
        x: 90,
        y: 37,
        team: 'away',
        stats: {
            points: 21,
            total_rebounds: 11,
            assists: 3,
            steals: 1,
            blocks: 2,
            minutes: 33,
            player_rating: 4.3
        }
    }

];

export default function LineupTab({ Team1, Team2, onPlayerClick }: LineupTabProps) {
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    console.log(Team1[0].player_rating)
    console.log(Team2[0].player_rating)


    const handleCloseCard = () => {
        setSelectedPlayer(null);
    };

    return (
        <>
            <div className="min-h-[100vh] rounded-2xl">
                <div className='bg-[#343434] h-15 rounded-t-2xl'></div>
                <div className='bg-[#2c2c2c] h-1'></div>
                <div className='bg-[#343434] h-15'></div>

                {/* Court Container */}
                <div className="relative w-full mx-auto aspect-[3/2] bg-[#2c2c2c] overflow-hidden shadow-2xl">
                    {/* Court Base */}
                    <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                    {/* Half-Court Line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#343434] transform -translate-x-1/2"></div>

                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 w-28 h-28 border-4 border-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                    {/* Left Key/Paint Area */}
                    <div className="absolute top-1/2 w-60 h-50 border-4 border-[#343434] transform -translate-y-1/2 border-l-0"></div>

                    {/* Right Key/Paint Area */}
                    <div className="absolute top-1/2 right-0 w-60 h-50 border-4 border-[#343434] transform -translate-y-1/2 border-r-0"></div>

                    {/* Left Free Throw Circle */}
                    <div className="absolute top-1/2 left-41 w-36 h-36 border-4 border-[#343434] rounded-full transform -translate-y-1/2"></div>

                    {/* Right Free Throw Circle */}
                    <div className="absolute top-1/2 right-41 w-36 h-36 border-4 border-[#343434] rounded-full transform -translate-y-1/2"></div>

                    {/* Left Three-Point Line */}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                        <div className="relative">
                            <div className="pt-10 pb-10">
                                <div className="w-90 h-130 border-4 border-l-0 border-[#343434] rounded-r-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Three-Point Line */}
                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                        <div className="relative">
                            <div className="pt-10 pb-10">
                                <div className="w-90 h-130 border-4 border-r-0 border-[#343434] rounded-l-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Player Indicators */}
                    {samplePlayers.map((player) => (
                        <PlayerIndicator
                            key={player.id}
                            player={player}
                            rating={player.stats?.player_rating}
                            onPlayerClick={onPlayerClick}
                        />
                    ))}
                </div>
            </div>

            {/* Player Card Modal */}
            <PlayerCard player={selectedPlayer} onClose={handleCloseCard} />
        </>
    );
}