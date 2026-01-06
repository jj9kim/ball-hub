import React from 'react';

interface ReserveIndicatorProps {
    player: any;
    team1Id: number;
    team2Id: number;
    onPlayerClick: (player: any) => void;
}

const ReserveIndicator: React.FC<ReserveIndicatorProps> = ({
    player,
    team1Id,
    team2Id,
    onPlayerClick
}) => {
    const isTeam1 = player.team_id === team1Id;

    return (
        <div
            className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#2a2a2a] ml-4"
            onClick={() => onPlayerClick(player)}
        >
            {/* Left side: Player info */}
            <div className="flex items-center space-x-3 flex-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden bg-white">
                    {/* Use Flask proxy instead of direct NBA URL */}
                    <img
                        src={`http://127.0.0.1:5000/api/nba-image/${player.player_id}`}
                        alt={player.player_name}
                        className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                    />
                </div>
                {/* Jersey number */}
                {player.stats?.jersey && (
                    <div className='text-[#ababab] text-xs pr-1'>#{player.stats.jersey}</div>
                )}

                {/* Player name */}
                <div className="text-white text-sm truncate">
                    {player.player_name}
                </div>

                {/* Position */}
                {player.position && (
                    <div className="text-xs text-gray-400">
                        {player.position}
                    </div>
                )}
            </div>

            {/* Right side: Team indicator */}
            <div className={`w-2 h-2 rounded-full ${isTeam1 ? 'bg-[#1e88e5]' : 'bg-[#e53935]'} mr-5`} />
        </div>
    );
};

export default ReserveIndicator;