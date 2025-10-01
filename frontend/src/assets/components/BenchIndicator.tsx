import type { Player } from './types/index.ts';

interface BenchIndicatorProps {
    player: Player;
    team1Id: number;
    team2Id: number;
    onPlayerClick: (player: Player) => void;
}

export default function BenchIndicator({ player, team1Id, team2Id, onPlayerClick }: BenchIndicatorProps) {
    const isTeam1 = player.team_id === team1Id;
    const isTeam2 = player.team_id === team2Id;

    return (
        <div className={`flex w-full ${isTeam1 ? 'justify-start' : 'justify-end'}`}>
            <div
                onClick={() => onPlayerClick(player)}
                className="group" // Added group here for tooltip
            >
                {/* Player Container - fixed width and centered */}
                <div className="hover:opacity-50 w-110 h-10 flex flex-row items-center rounded-lg px-6 mt-3">
                    {/* Player Image/Number */}
                    {player.photoUrl ? (
                        <div className="w-12 h-12 bg-opacity-20 rounded-full flex items-center justify-center bg-[#4a4a4a] flex-shrink-0">
                            <img
                                src={player.photoUrl}
                                alt={player.player_name}
                                className="w-11 h-11 rounded-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-opacity-20 rounded-full flex items-center justify-center bg-[#4a4a4a] flex-shrink-0">
                            <span className="text-white text-lg font-bold">#{player.number}</span>
                        </div>
                    )}

                    {/* Rating Circle */}
                    <div className={`rounded-full w-8 h-6 flex items-center justify-center text-black font-bold text-xs flex-shrink-0 ml-7 ${Math.round((player.stats?.player_rating || 0) * 10) / 10 < 5 ? 'bg-red-500' :
                        Math.round((player.stats?.player_rating || 0) * 10) / 10 < 7 ? 'bg-orange-500' :
                            'bg-[#32c771]'
                        }`}>
                        {player.stats?.player_rating?.toFixed(1)}
                    </div>

                    {/* Player Info - centered and takes available space */}
                    <div className='flex flex-row items-center justify-center '>
                        <div className='text-[#ababab] text-xs ml-7'>#{player.number}</div>
                        <div className='flex flex-col align-start'>
                            <div className='text-white text-xs font-medium w-full ml-7'>
                                {player.player_name}
                            </div>
                            <div className="text-[#9f9f9f] text-xs font-medium w-full ml-7">
                                {player.position === 'F' ? 'Forward' :
                                    player.position === 'G' ? 'Guard' :
                                        player.position === 'C' ? 'Center' : player.position}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Player Name Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                    <div className="bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {player.player_name}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black border-t-opacity-90"></div>
                </div>
            </div>
        </div>
    );
}