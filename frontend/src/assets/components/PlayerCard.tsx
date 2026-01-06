import type { Player } from './types/index.ts';
import { useRef, useEffect, useState } from 'react';
import { teamIdToName } from '../../utils/teamMappings.ts';

interface PlayerCardProps {
    player: Player | null;
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    currentIndex?: number;
    totalPlayers?: number;
}

export default function PlayerCard({
    player,
    onClose,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
    currentIndex,
    totalPlayers
}: PlayerCardProps) {
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

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!player) return;

            if (event.key === 'ArrowLeft' && hasPrevious) {
                onPrevious();
            } else if (event.key === 'ArrowRight' && hasNext) {
                onNext();
            } else if (event.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [player, hasNext, hasPrevious, onNext, onPrevious]);

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
            className={`fixed inset-0 bg-black/70 z-1000 flex items-center justify-center transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            onClick={handleClose}
        >
            <div
                ref={playerCardRef}
                className="bg-[#1d1d1d] border-2 border-white rounded-2xl max-w-md w-full mx-auto shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Navigation Arrows */}
                {hasPrevious && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPrevious();
                        }}
                        className="absolute top-14 left-8 transform -translate-y-1/2 bg-white/20 hover:bg-white rounded-full p-3 transition-all duration-200 z-10 fill-white hover:fill-black"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                        </svg>
                    </button>
                )}

                {hasNext && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNext();
                        }}
                        className="absolute top-14 right-8 transform -translate-y-1/2 bg-white/20 hover:bg-white rounded-full p-3 transition-all duration-200 z-10 fill-white hover:fill-black"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                    </button>
                )}


                {/* Card Content */}
                <div className="min-h-[80vh]">
                    {/* Remove the flex row and center everything */}
                    <div className="flex flex-col items-center p-6"> {/* Changed to flex-col and items-center */}
                        {/* Player Photo or Jersey Circle */}
                        <div className="flex flex-col items-center w-full"> {/* Added w-full */}
                            <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden bg-white">
                                    {/* Use Flask proxy instead of direct NBA URL */}
                                    <img
                                        src={`http://127.0.0.1:5000/api/nba-image/${player.player_id}`}
                                        alt={player.player_name}
                                        className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <div className={`absolute -top-1 left-12 rounded-full w-8 h-6 flex items-center justify-center text-black font-bold text-sm z-10 ${Math.round((player.stats?.player_rating || 0) * 10) / 10 < 5 ? 'bg-red-500' :
                                    Math.round((player.stats?.player_rating || 0) * 10) / 10 < 7 ? 'bg-orange-500' :
                                        'bg-[#32c771]'
                                    }`}>
                                    {player.stats?.player_rating?.toFixed(1)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                    {player.position}
                                </div>
                            </div>

                            <div className='text-white font-bold mb-3 text-center'>{player.player_name}</div> {/* Removed flex justify-center, added text-center */}

                            {/* Stats container */}
                            <div className="flex flex-row justify-between w-full max-w-xs">
                                <div className='flex flex-col items-center'>
                                    <div className="text-white font-medium">
                                        {player.position}
                                    </div>
                                    <div className="text-[#9f9f9f] text-xs font-medium">Position</div>
                                </div>

                                <div className='flex flex-col items-center'>
                                    <p className="text-white  text-opacity-80">{teamIdToName[player.team_id]}</p>
                                    <div className="text-[#9f9f9f] text-xs font-medium">Team</div>
                                </div>

                                <div className='flex flex-col items-center'>
                                    <div className="text-white text-opacity-80">{(player.stats?.player_rating)?.toFixed(2)}</div>
                                    <div className="text-[#9f9f9f] text-xs font-medium">Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='bg-[#2c2c2c] h-0.5'></div>

                    {/* Stats Grid */}
                    {player.stats && (
                        <div className='max-h-96 overflow-y-auto 
                        [scrollbar-width:thin] 
                        [scrollbar-color:#404040_#1d1d1d]
                        [&::-webkit-scrollbar]:w-2
                        [&::-webkit-scrollbar-track]:bg-[#1d1d1d]
                        [&::-webkit-scrollbar-thumb]:bg-[#404040]
                        [&::-webkit-scrollbar-thumb]:rounded-full'>
                            <div className='bg-[#141414] h-20'></div>
                            <div className='bg-[#1d1d1d] text-white'>
                                <p className='pl-5 pt-5'>Top Stats</p>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Minutes Played</div>
                                    <div>{Number(player.stats.minutes).toFixed(0)}</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Points</div>
                                    <div>{player.stats.points}</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Rebounds</div>
                                    <div>{player.stats.total_rebounds}</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Assists</div>
                                    <div>{player.stats.assists}</div>
                                </div>
                            </div>
                            <div className='bg-[#2c2c2c] h-0.5 mt-5'></div>
                            <div className='bg-[#1d1d1d] text-white'>
                                <p className='pl-5 pt-5'>Offense</p>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Field Goals</div>
                                    <div>{player.stats.fg_made}/{player.stats.fg_attempted} {((player.stats?.fg_percentage ?? 0) * 100).toFixed(2)}%</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Three Points</div>
                                    <div>{player.stats.three_pt_made}/{player.stats.three_pt_attempted} {((player.stats?.three_pt_percentage ?? 0) * 100).toFixed(2)}%</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Free Throws</div>
                                    <div>{player.stats.ft_made}/{player.stats.ft_attempted} {((player.stats?.ft_percentage ?? 0) * 100).toFixed(2)}%</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Turnovers</div>
                                    <div>{player.stats.turnovers}</div>
                                </div>
                            </div>
                            <div className='bg-[#2c2c2c] h-0.5 mt-5'></div>
                            <div className='bg-[#1d1d1d] text-white'>
                                <p className='pl-5 pt-5'>Defence</p>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Steals</div>
                                    <div>{player.stats.steals}</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Blocks</div>
                                    <div>{player.stats.blocks}</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Personal Fouls</div>
                                    <div>{player.stats.personal_fouls}</div>
                                </div>
                                <div className='flex flex-row justify-between pl-5 pr-5 text-xs pt-5'>
                                    <div>Plus Minus</div>
                                    <div>{player.stats.plus_minus}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}