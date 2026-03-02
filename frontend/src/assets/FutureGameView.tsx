import React from 'react';
import type { FullScheduleGame } from '../api/nbaService';

interface FutureGameViewProps {
    game: FullScheduleGame;
}

export default function FutureGameView({ game }: FutureGameViewProps) {
    const formatGameTime = (timeStr: string | undefined): string => {
        if (!timeStr) return 'TBD';
        return timeStr;
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between">
                {/* Away Team */}
                <div className="flex-1 text-center">
                    <img
                        src={`http://127.0.0.1:5000/api/team-logo/${game.awayTeam_teamId}`}
                        alt={game.awayTeam_teamName}
                        className="w-24 h-24 mx-auto mb-4"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div className="text-white text-xl font-bold">{game.awayTeam_teamName}</div>
                    <div className="text-gray-400 mt-2">
                        {game.awayTeam_wins} - {game.awayTeam_losses}
                    </div>
                </div>

                {/* VS */}
                <div className="px-8">
                    <div className="text-yellow-500 text-4xl font-bold">VS</div>
                    <div className="text-gray-500 text-center mt-2">{formatGameTime(game.gameTimeEst)}</div>
                </div>

                {/* Home Team */}
                <div className="flex-1 text-center">
                    <img
                        src={`http://127.0.0.1:5000/api/team-logo/${game.homeTeam_teamId}`}
                        alt={game.homeTeam_teamName}
                        className="w-24 h-24 mx-auto mb-4"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div className="text-white text-xl font-bold">{game.homeTeam_teamName}</div>
                    <div className="text-gray-400 mt-2">
                        {game.homeTeam_wins} - {game.homeTeam_losses}
                    </div>
                </div>
            </div>

            {/* Game details */}
            <div className="mt-8 border-t border-gray-700 pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div className="text-gray-400 text-sm">Game Time</div>
                        <div className="text-white font-semibold">
                            {game.gameTimeEst || 'TBD'}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">Arena</div>
                        <div className="text-white font-semibold">
                            {game.arenaName || 'TBD'}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">Location</div>
                        <div className="text-white font-semibold">
                            {game.arenaCity || ''} {game.arenaState || ''}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">Status</div>
                        <div className="text-yellow-500 font-semibold">
                            {game.gameStatusText || 'Scheduled'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Series info if applicable */}
            {game.seriesText && (
                <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                    <div className="text-gray-400 text-sm">Series</div>
                    <div className="text-white font-semibold">{game.seriesText}</div>
                    {game.ifNecessary && (
                        <div className="text-yellow-500 text-sm mt-1">* If necessary</div>
                    )}
                </div>
            )}

            {/* Additional info */}
            <div className="mt-6 text-gray-400 text-sm text-center">
                {game.isNeutral && 'Neutral Site'}
                {game.postponedStatus && <div className="text-red-400 mt-2">{game.postponedStatus}</div>}
            </div>
        </div>
    );
}