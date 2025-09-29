import type { Player } from './types/index.ts';

interface PlayerCardProps {
    player: Player | null;
    onClose: () => void;
}

export default function PlayerCard({ player, onClose }: PlayerCardProps) {
    if (!player) return null;

    const teamColors = {
        home: {
            bg: 'bg-blue-600',
            border: 'border-blue-400',
            accent: 'bg-blue-500'
        },
        away: {
            bg: 'bg-red-600',
            border: 'border-red-400',
            accent: 'bg-red-500'
        }
    };

    const colors = teamColors[player.team];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100`}>
                {/* Card Header */}
                <div className="flex justify-between items-center p-4 border-b border-white border-opacity-20">
                    <h3 className="text-white text-xl font-bold">Player Profile</h3>
                    <button
                        onClick={onClose}
                        className="text-white text-2xl hover:text-gray-300 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-10"
                    >
                        ×
                    </button>
                </div>

                {/* Player Info */}
                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                        {/* Player Photo or Jersey Circle */}
                        <div className="relative">
                            {player.photoUrl ? (
                                <img
                                    src={player.photoUrl}
                                    alt={player.name}
                                    className="w-20 h-20 rounded-full border-2 border-white object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-2 border-white">
                                    <span className="text-white text-2xl font-bold">#{player.number}</span>
                                </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 ${colors.accent} text-white text-xs px-2 py-1 rounded-full font-bold`}>
                                {player.position}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-white text-2xl font-bold mb-1">{player.name}</h4>
                            <p className="text-white text-opacity-80 mb-2">#{player.number} • {player.team === 'home' ? 'Home' : 'Away'} Team</p>
                            <div className="flex items-center space-x-2">
                                <span className="text-white text-opacity-90 text-sm">Rating:</span>
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`text-lg ${star <= (player.stats?.player_rating || 0) ? 'text-yellow-400' : 'text-gray-400'}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                    <span className="text-white text-sm ml-2">{player.stats?.player_rating?.toFixed(1) || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {player.stats && (
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-white text-2xl font-bold">{player.stats.points || 0}</div>
                                <div className="text-white text-opacity-80 text-sm">Points</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-white text-2xl font-bold">{player.stats.total_rebounds || 0}</div>
                                <div className="text-white text-opacity-80 text-sm">Rebounds</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-white text-2xl font-bold">{player.stats.assists || 0}</div>
                                <div className="text-white text-opacity-80 text-sm">Assists</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-white text-2xl font-bold">{player.stats.steals || 0}</div>
                                <div className="text-white text-opacity-80 text-sm">Steals</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-white text-2xl font-bold">{player.stats.blocks || 0}</div>
                                <div className="text-white text-opacity-80 text-sm">Blocks</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-white text-lg font-bold">{player.stats.minutes || '0:00'}</div>
                                <div className="text-white text-opacity-80 text-sm">Minutes</div>
                            </div>
                        </div>
                    )}

                    {/* Additional Info */}
                    <div className="mt-6 pt-4 border-t border-white border-opacity-20">
                        <div className="flex justify-between text-white text-opacity-80 text-sm">
                            <span>Position</span>
                            <span className="font-medium">{player.position}</span>
                        </div>
                        <div className="flex justify-between text-white text-opacity-80 text-sm mt-2">
                            <span>Team</span>
                            <span className="font-medium">{player.team === 'home' ? 'Home' : 'Away'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}