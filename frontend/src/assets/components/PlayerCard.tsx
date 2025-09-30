import type{ Player } from './types/index.ts';
import { useRef, useEffect } from 'react';

interface PlayerCardProps {
    player: Player | null;
    onClose: () => void;
}

export default function PlayerCard({ player, onClose }: PlayerCardProps) {
    const playerCardRef = useRef<HTMLDivElement>(null);
    const scrollYRef = useRef<number>(0);

    // Handle click outside and scroll prevention
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (playerCardRef.current && !playerCardRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (player) {
            // Save current scroll position
            scrollYRef.current = window.scrollY;

            // Calculate scrollbar width to prevent layout shift
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            // Prevent scrolling without layout shift
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollYRef.current}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';

            // Compensate for scrollbar removal to prevent layout shift
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }

            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);

            // Restore scrolling and layout
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // Restore scroll position
            window.scrollTo(0, scrollYRef.current);
        };
    }, [player, onClose]);

    if (!player) return null;

    return (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/70 flex justify-center items-start z-1000 pt-20">
            <div ref={playerCardRef} className="relative p-4 w-full max-w-md bg-[#1d1d1d] rounded-lg shadow-xl border-2 border-white">
                {/* Card Header */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={onClose}
                        className="text-white text-2xl hover:text-gray-300 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-10"
                    >
                        ×
                    </button>
                </div>

                {/* Player Info */}
                <div className="p-4 h-130">
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
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
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