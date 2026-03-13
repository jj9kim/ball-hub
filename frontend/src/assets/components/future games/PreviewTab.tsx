import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FullScheduleGame } from '../../../api/nbaService';

interface PreviewTabProps {
    futureGame: FullScheduleGame;
    homeTeamStarters: any[];
    awayTeamStarters: any[];
    startersLoading: boolean;
    startersError: string | null;
    teamsThisGame: Array<{ team_id: number; team_name: string; points: number }>;
    mapStartersToCourt: (starters: any[], isHomeTeam: boolean) => any[];
}

export default function PreviewTab({
    futureGame,
    homeTeamStarters,
    awayTeamStarters,
    startersLoading,
    startersError,
    teamsThisGame,
    mapStartersToCourt
}: PreviewTabProps) {
    const navigate = useNavigate();

    return (
        <div className='rounded-2xl min-h-[100vh]'>
            <div className='bg-[#343434] h-15 rounded-t-2xl flex items-center px-6'>
                <h3 className="text-white font-semibold">Projected Starting Lineups</h3>
            </div>
            <div className='bg-[#2c2c2c] h-1'></div>
            <div className='bg-[#343434] h-15 flex items-center px-6'>
            </div>

            {startersLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Loading starters...</p>
                </div>
            ) : startersError ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-red-400">{startersError}</p>
                </div>
            ) : (
                <div className="p-4">
                    {/* Single Court with Both Teams */}
                    <div className="relative w-full mx-auto aspect-[3/2] bg-[#2c2c2c] shadow-2xl">
                        <div className="relative w-full h-full bg-[#2c2c2c] overflow-hidden">
                            {/* Court Base */}
                            <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                            {/* Half-Court Line */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#343434] transform -translate-x-1/2"></div>

                            {/* Center Circle */}
                            <div className="absolute top-1/2 left-1/2 w-28 h-28 border-4 border-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                            {/* Left Key/Paint Area */}
                            <div className="absolute top-1/2 left-0 w-60 h-50 border-4 border-[#343434] transform -translate-y-1/2 border-l-0"></div>

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

                            

                            {/* Home Team Starters (Left Side) */}
                            {mapStartersToCourt(homeTeamStarters, true).map((player) => (
                                <div
                                    key={`home-${player.player_id}`}
                                    className="absolute cursor-pointer hover:scale-110 transition-transform"
                                    style={{
                                        left: `${player.courtPosition.x}%`,
                                        top: `${player.courtPosition.y}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    onClick={() => navigate(`/player/${player.player_id}`)}
                                >
                                    <div className="relative w-30 h-30 flex flex-col items-center whitespace-nowrap">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-blue-500 bg-white">
                                            <img
                                                src={`http://127.0.0.1:5000/api/nba-image/${player.player_id}`}
                                                alt={player.name}
                                                className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        const initials = player.name
                                                            .split(' ')
                                                            .map((n: string) => n[0])
                                                            .join('')
                                                            .toUpperCase()
                                                            .substring(0, 2);
                                                        parent.innerHTML = `
                                                            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center border-2 border-blue-500">
                                                                <span class="text-xl font-bold text-white">${initials}</span>
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className='flex flex-row justify-center mt-1 bg-black bg-opacity-60 px-2 py-0.5 rounded-full'>
                                            <div className='text-[#ababab] text-[11px] pr-1'>
                                                #{player.jersey || ''}
                                            </div>
                                            <div className='text-white text-[11px]'>
                                                {player.name.split(' ').pop()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Away Team Starters (Right Side) */}
                            {mapStartersToCourt(awayTeamStarters, false).map((player) => (
                                <div
                                    key={`away-${player.player_id}`}
                                    className="absolute cursor-pointer hover:scale-110 transition-transform"
                                    style={{
                                        left: `${player.courtPosition.x}%`,
                                        top: `${player.courtPosition.y}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    onClick={() => navigate(`/player/${player.player_id}`)}
                                >
                                    <div className="relative w-30 h-30 flex flex-col items-center whitespace-nowrap">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-red-500 bg-white">
                                            <img
                                                src={`http://127.0.0.1:5000/api/nba-image/${player.player_id}`}
                                                alt={player.name}
                                                className="absolute top-0 left-0 w-full h-full rounded-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        const initials = player.name
                                                            .split(' ')
                                                            .map((n: string) => n[0])
                                                            .join('')
                                                            .toUpperCase()
                                                            .substring(0, 2);
                                                        parent.innerHTML = `
                                                            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-red-900 to-purple-900 flex items-center justify-center border-2 border-red-500">
                                                                <span class="text-xl font-bold text-white">${initials}</span>
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className='flex flex-row justify-center mt-1 bg-black bg-opacity-60 px-2 py-0.5 rounded-full'>
                                            <div className='text-[#ababab] text-[11px] pr-1'>
                                                #{player.jersey || ''}
                                            </div>
                                            <div className='text-white text-[11px]'>
                                                {player.name.split(' ').pop()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}