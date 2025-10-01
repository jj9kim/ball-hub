import type { Player, Stats } from '../types/index.ts';
import PlayerIndicator from '../PlayerIndicator';
import BenchIndicator from '../BenchIndicator.tsx';

interface LineupTabProps {
    Team1: Stats[];
    Team2: Stats[];
    team1Id: number;
    team2Id: number;
    onPlayerClick: (player: Player) => void;
}

// Function to convert Stats to Player with smart position mapping
const mapStatsToPlayers = (teamStats: Stats[], teamId: number, isHomeTeam: boolean): Player[] => {
    // Filter out bench players for now (position_sort = 3)
    const courtPlayers = teamStats.filter(player => player.position_sort !== 3);

    return courtPlayers.map((stat, index) => {
        let position = '';
        let courtPosition = { x: 50, y: 50 }; // default

        // Map position_sort to actual positions based on stats
        if (stat.position_sort === 1) {
            // Center
            position = 'C';
            courtPosition = isHomeTeam ? { x: 10, y: 50 } : { x: 90, y: 72 };
        }
        else if (stat.position_sort === 0) {
            // Forwards - higher rebounds becomes PF, lower becomes SF
            const forwards = teamStats.filter(p => p.position_sort === 0);
            const sortedForwards = [...forwards].sort((a, b) => (b.total_rebounds || 0) - (a.total_rebounds || 0));

            if (stat === sortedForwards[0]) {
                position = 'PF'; // Higher rebounds = Power Forward
                courtPosition = isHomeTeam ? { x: 10, y: 85 } : { x: 90, y: 37 };
            } else {
                position = 'SF'; // Lower rebounds = Small Forward
                courtPosition = isHomeTeam ? { x: 27, y: 27 } : { x: 73, y: 95 };
            }
        }
        else if (stat.position_sort === 2) {
            // Guards - higher assists becomes PG, lower becomes SG
            const guards = teamStats.filter(p => p.position_sort === 2);
            const sortedGuards = [...guards].sort((a, b) => (b.assists || 0) - (a.assists || 0));

            if (stat === sortedGuards[0]) {
                position = 'PG'; // Higher assists = Point Guard
                courtPosition = isHomeTeam ? { x: 42, y: 60 } : { x: 58, y: 60 };
            } else {
                position = 'SG'; // Lower assists = Shooting Guard
                courtPosition = isHomeTeam ? { x: 32, y: 95 } : { x: 68, y: 25 };
            }
        }
        else {
            // Fallback for any other position_sort values
            position = stat.position || 'Player';
            const fallbackPositions = isHomeTeam
                ? [
                    { x: 25, y: 85 }, { x: 40, y: 70 }, { x: 60, y: 70 },
                    { x: 75, y: 85 }, { x: 50, y: 90 }
                ]
                : [
                    { x: 75, y: 85 }, { x: 60, y: 70 }, { x: 40, y: 70 },
                    { x: 25, y: 85 }, { x: 50, y: 90 }
                ];
            courtPosition = fallbackPositions[index % fallbackPositions.length];
        }

        return {
            player_id: stat.player_id,
            player_name: stat.player_name,
            number: String(stat.player_id),
            position: position,
            x: courtPosition.x,
            y: courtPosition.y,
            team_id: teamId,
            stats: {
                points: stat.points || 0,
                total_rebounds: stat.total_rebounds || 0,
                assists: stat.assists || 0,
                steals: stat.steals || 0,
                blocks: stat.blocks || 0,
                minutes: stat.minutes,
                player_rating: stat.player_rating
            }
        };
    });
};

const mapPlayersToBench = (teamStats: Stats[], teamId: number): Player[] => {
    const courtPlayers = teamStats.filter(player => player.position_sort == 3)
    return courtPlayers.map((stat) => {
        return {
            player_id: stat.player_id,
            player_name: stat.player_name,
            number: String(stat.player_id),
            position: stat.position,
            x: 0,
            y: 0,
            team_id: teamId,
            stats: {
                points: stat.points || 0,
                total_rebounds: stat.total_rebounds || 0,
                assists: stat.assists || 0,
                steals: stat.steals || 0,
                blocks: stat.blocks || 0,
                minutes: stat.minutes,
                player_rating: stat.player_rating
            }
        }
    })
}

export default function LineupTab({ Team1, Team2, team1Id, team2Id, onPlayerClick }: LineupTabProps) {
    // Team1 = home team (left side), Team2 = away team (right side)
    const homePlayers = mapStatsToPlayers(Team1, team1Id, true);   // true = home team
    const awayPlayers = mapStatsToPlayers(Team2, team2Id, false);  // false = away team
    const allPlayers = [...homePlayers, ...awayPlayers];
    const benchHome = mapPlayersToBench(Team1, team1Id);
    const benchAway = mapPlayersToBench(Team2, team2Id);
    const benchPlayers = [...benchHome, ...benchAway];

    return (
        <div className="min-h-[100vh] rounded-2xl">
            <div className='bg-[#343434] h-15 rounded-t-2xl'></div>
            <div className='bg-[#2c2c2c] h-1'></div>
            <div className='bg-[#343434] h-15'></div>

            {/* Court Container with relative positioning for absolute children */}
            <div className="relative w-full mx-auto aspect-[3/2] bg-[#2c2c2c] shadow-2xl">
                {/* Court Container - remove overflow-hidden or keep it for court elements only */}
                <div className="relative w-full h-full bg-[#2c2c2c] overflow-hidden">
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
                </div>

                {/* Player Indicators - OUTSIDE the overflow-hidden container but inside the relative parent */}
                {allPlayers.map((player) => (
                    <PlayerIndicator
                        key={player.player_id}
                        player={player}
                        onPlayerClick={onPlayerClick}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-8 w-full">
                {/* Left column for team 1 */}
                <div className="space-y-4">
                    <h3 className="text-white text-center">Team 1 Bench</h3>
                    {benchPlayers.filter(player => player.team_id === team1Id).map((player) => (
                        <BenchIndicator
                            key={player.player_id}
                            player={player}
                            team1Id={team1Id}
                            team2Id={team2Id}
                            onPlayerClick={onPlayerClick}
                        />
                    ))}
                </div>

                {/* Right column for team 2 */}
                <div className="space-y-4">
                    <h3 className="text-white text-center">Team 2 Bench</h3>
                    {benchPlayers.filter(player => player.team_id === team2Id).map((player) => (
                        <BenchIndicator
                            key={player.player_id}
                            player={player}
                            team1Id={team1Id}
                            team2Id={team2Id}
                            onPlayerClick={onPlayerClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}