import type { Player, Stats } from '../types/index.ts';
import PlayerIndicator from '../PlayerIndicator';
import BenchIndicator from '../BenchIndicator.tsx';
import ReserveIndicator from '../ReserveIndicator.tsx';

interface LineupTabProps {
    Team1: Stats[];
    Team2: Stats[];
    team1Id: number;
    team2Id: number;
    onPlayerClick: (player: Player) => void;
}

// Function to convert Stats to Player with smart position mapping
const mapStatsToPlayers = (teamStats: Stats[], teamId: number, isHomeTeam: boolean): Player[] => {
    // Filter IN court players (position_sort 1-5), NOT bench players
    const courtPlayers = teamStats.filter(player => player.position_sort >= 1 && player.position_sort <= 5);

    return courtPlayers.map((stat, index) => {
        let position = '';
        let courtPosition = { x: 50, y: 50 }; // default

        // Map position_sort to actual positions based on stats
        if (stat.position_sort === 5) {
            // Center
            position = 'C';
            courtPosition = isHomeTeam ? { x: 10, y: 50 } : { x: 90, y: 72 };
        } else if (stat.position_sort === 4) {
            position = 'PF'
            courtPosition = isHomeTeam ? { x: 10, y: 85 } : { x: 90, y: 37 };
        } else if (stat.position_sort === 3) {
            position = 'SF';
            courtPosition = isHomeTeam ? { x: 27, y: 27 } : { x: 73, y: 95 };
        }  else if (stat.position_sort === 2) {
            position = 'SG'; // Lower assists = Shooting Guard
            courtPosition = isHomeTeam ? { x: 32, y: 95 } : { x: 68, y: 25 };
        } else if (stat.position_sort === 1) {
            position = 'PG'; // Higher assists = Point Guard
            courtPosition = isHomeTeam ? { x: 42, y: 60 } : { x: 58, y: 60 };
        } else {
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

        console.log("Jersey debug for", stat.player_name, ":", {
            jerseyValue: stat.jersey,
            jerseyType: typeof stat.jersey,
            isString: typeof stat.jersey === 'string',
            isEmptyString: stat.jersey === '',
            isNull: stat.jersey === null,
            isUndefined: stat.jersey === undefined,
            statObject: stat  // Show the entire stat object
        });

        return {
            player_id: stat.player_id,
            player_name: stat.player_name,
            number: String(stat.player_id),
            position: position,
            x: courtPosition.x,
            y: courtPosition.y,
            team_id: teamId,
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
                jersey: stat.jersey,
                plus_minus: stat.plus_minus || 0,
                player_rating: stat.player_rating,
            }
        };
    });
};

const mapPlayersToBench = (teamStats: Stats[], teamId: number): Player[] => {
    // Filter for bench players (position_sort == 6)
    const benchPlayers = teamStats.filter(player => player.position_sort == 6);
    return benchPlayers.map((stat) => {
        return {
            player_id: stat.player_id,
            player_name: stat.player_name,
            number: String(stat.player_id),
            position: stat.position,
            x: 0,
            y: 0,
            team_id: teamId,
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
                jersey: stat.jersey,
                plus_minus: stat.plus_minus || 0,
                player_rating: stat.player_rating,
            }
        }
    })
}

export default function LineupTab({ Team1, Team2, team1Id, team2Id, onPlayerClick }: LineupTabProps) {
    console.log('LineupTab received:');
    console.log('- Team1 count:', Team1.length);
    console.log('- Team2 count:', Team2.length);

    if (Team1.length > 0) {
        console.log('- Team1 first player:', {
            name: Team1[0].player_name,
            position: Team1[0].position,
            position_sort: Team1[0].position_sort,
            minutes: Team1[0].minutes
        });
    }

    if (Team2.length > 0) {
        console.log('- Team2 first player:', {
            name: Team2[0].player_name,
            position: Team2[0].position,
            position_sort: Team2[0].position_sort,
            minutes: Team2[0].minutes
        });
    }
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
                {/* Bench Section */}
                <h2 className='col-span-2 text-center text-white font-bold mt-8'>Bench</h2>

                {/* Team 1 Bench */}
                <div className="space-y-4">
                    {benchPlayers
                        .filter(player => player.team_id === team1Id && (player.stats?.minutes || 0) > 0)
                        .map((player) => (
                            <div key={player.player_id}>
                                <div className='bg-[#2c2c2c] h-0.5 ml-5 mr-5'></div>
                                <BenchIndicator
                                    player={player}
                                    team1Id={team1Id}
                                    team2Id={team2Id}
                                    onPlayerClick={onPlayerClick}
                                />
                            </div>
                        ))}
                </div>

                {/* Team 2 Bench */}
                <div className="space-y-4">
                    {benchPlayers
                        .filter(player => player.team_id === team2Id && (player.stats?.minutes || 0) > 0)
                        .map((player) => (
                            <div key={player.player_id}>
                                <div className='bg-[#2c2c2c] h-0.5 ml-5 mr-5'></div>
                                <BenchIndicator
                                    player={player}
                                    team1Id={team1Id}
                                    team2Id={team2Id}
                                    onPlayerClick={onPlayerClick}
                                />
                            </div>
                        ))}
                </div>

                {/* Reserves Section - Different Format */}
                {(benchPlayers.some(player => (player.stats?.minutes || 0) === 0)) && (
                    <>
                        <h2 className='col-span-2 text-center text-white font-bold'>Reserves and Injuries</h2>

                        {/* Team 1 Reserves */}
                        <div className="space-y-4">
                            {benchPlayers
                                .filter(player => player.team_id === team1Id && (player.stats?.minutes || 0) === 0)
                                .map((player) => (
                                    <div key={player.player_id}>
                                        <div className='bg-[#2c2c2c] h-0.5 ml-5 mr-5'></div>
                                        <ReserveIndicator
                                            player={player}
                                            team1Id={team1Id}
                                            team2Id={team2Id}
                                            onPlayerClick={onPlayerClick}
                                        />
                                    </div>
                                ))}
                        </div>

                        {/* Team 2 Reserves */}
                        <div className="space-y-4">
                            {benchPlayers
                                .filter(player => player.team_id === team2Id && (player.stats?.minutes || 0) === 0)
                                .map((player) => (
                                    <div key={player.player_id}>
                                        <div className='bg-[#2c2c2c] h-0.5 ml-5 mr-5'></div>
                                        <ReserveIndicator
                                            player={player}
                                            team1Id={team1Id}
                                            team2Id={team2Id}
                                            onPlayerClick={onPlayerClick}
                                        />
                                    </div>
                                ))}
                        </div>
                    </>
                )}
            </div>
            <div className='h-5'></div>
        </div>
    );
}