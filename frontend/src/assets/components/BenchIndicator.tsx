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
        <div className={`grid grid-cols-2 gap-4 w-full ${isTeam1 ? 'justify-self-start' : 'justify-self-end'}`}>
            <div
                onClick={() => onPlayerClick(player)}
                className={`flex ${isTeam1 ? 'justify-start' : 'justify-end'}`}
            >
                {/* Player Circle with Number */}
                <div className="relative hover:opacity-50 w-50 h-50 flex flex-col items-center">
                    <div className={`absolute -top-3 right-15 rounded-full w-8 h-6 flex items-center justify-center text-black font-bold text-sm z-10 ${(player.stats?.player_rating || 0) < 5 ? 'bg-red-500' :
                        (player.stats?.player_rating || 0) < 7 ? 'bg-orange-500' :
                            'bg-[#32c771]'
                        }`}>
                        {player.stats?.player_rating?.toFixed(1)}
                    </div>
                    {player.photoUrl ? (
                        <div className="w-16 h-16 bg-opacity-20 rounded-full flex items-center justify-center bg-[#4a4a4a]">
                            <img
                                src={player.photoUrl}
                                alt={player.player_name}
                                className="absolute top-2 w-14 h-14 rounded-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-opacity-20 rounded-full flex items-center justify-center bg-[#4a4a4a]">
                            <span className="text-white text-2xl font-bold">#{player.number}</span>
                        </div>
                    )}
                    <div className='flex flex-row justify-center'>
                        <div className='text-[#ababab] text-xs pr-1'>#{player.number}</div>
                        <div className='text-white text-xs'>{player.player_name}</div>
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