import type { Player } from './types/index.ts';
import { useRef, useEffect, useState } from 'react';
import { teamIdToName } from '../../utils/teamMappings.ts';

interface PlayerCardProps {
    player: Player | null;
    onClose: () => void;
}

export default function PlayerCard({ player, onClose }: PlayerCardProps) {
    const playerCardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Handle scrollbar preservation and transitions
    useEffect(() => {
        if (player) {
            // Calculate scrollbar width
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            // Prevent scrolling but preserve scrollbar space
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }

            // Trigger animation after a small delay
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
        }

        return () => {
            // Restore scrolling
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [player]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (playerCardRef.current && !playerCardRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        if (player) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [player]);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for animation to complete before closing
        setTimeout(() => {
            onClose();
        }, 200);
    };

    if (!player) return null;

    return (
        <div
            className={`fixed inset-0 bg-black/70 z-1000 flex items-center justify-center transition-all duration-500 ${isVisible
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
            onClick={handleClose}
        >
            <div
                ref={playerCardRef}
                className="bg-[#1d1d1d] border-2 border-white rounded-2xl max-w-md w-full mx-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Card Header */}
                {/* Player Info */}
                <div className="p-6 min-h-[80vh]">
                    <div className="flex items-center space-x-4 mb-6">
                        {/* Player Photo or Jersey Circle */}
                        <div className="relative">
                            {player.photoUrl ? (
                                <img
                                    src={player.photoUrl}
                                    alt={player.player_name}
                                    className="w-20 h-20 rounded-full border-2 border-white object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-2 border-white">
                                    <span className="text-white text-2xl font-bold">#{player.number}</span>
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                {player.position}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-white text-2xl font-bold mb-1">{player.player_name}</h4>
                            <p className="text-white text-opacity-80 mb-2">#{player.number} • {teamIdToName[player.team_id]}</p>
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
                                <div className="text-black text-2xl font-bold">{player.stats.points || 0}</div>
                                <div className="text-black text-opacity-80 text-sm">Points</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-black text-2xl font-bold">{player.stats.total_rebounds || 0}</div>
                                <div className="text-black text-opacity-80 text-sm">Rebounds</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-black text-2xl font-bold">{player.stats.assists || 0}</div>
                                <div className="text-black text-opacity-80 text-sm">Assists</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-black text-2xl font-bold">{player.stats.steals || 0}</div>
                                <div className="text-black text-opacity-80 text-sm">Steals</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-black text-2xl font-bold">{player.stats.blocks || 0}</div>
                                <div className="text-black text-opacity-80 text-sm">Blocks</div>
                            </div>
                            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                                <div className="text-black text-lg font-bold">{player.stats.minutes || '0:00'}</div>
                                <div className="text-black text-opacity-80 text-sm">Minutes</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}