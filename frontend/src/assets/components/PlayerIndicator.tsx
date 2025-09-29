import type { Player } from './types/index.ts';

interface PlayerIndicatorProps {
    player: Player;
    onPlayerClick: (player: Player) => void;
}

export default function PlayerIndicator({ player, onPlayerClick }: PlayerIndicatorProps) {
    const teamColors = {
        home: {
            bg: 'bg-blue-500',
            border: 'border-blue-300',
            hover: 'hover:bg-blue-600'
        },
        away: {
            bg: 'bg-red-500',
            border: 'border-red-300',
            hover: 'hover:bg-red-600'
        }
    };

    const colors = teamColors[player.team];

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
            style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
            }}
            onClick={() => onPlayerClick(player)}
        >
            {/* Player Circle with Number */}
            <div className={`${colors.bg} ${colors.border} ${colors.hover} text-white rounded-full w-12 h-12 flex items-center justify-center border-2 border-white shadow-lg font-bold text-lg transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl`}>
                {player.number}
            </div>

            {/* Player Name Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                <div className="bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {player.name}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black border-t-opacity-90"></div>
            </div>
        </div>
    );
}