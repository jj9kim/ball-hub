// assets/components/teamprofile/tabs/TeamRosterTab.tsx
import { useEffect } from 'react';
import type { Player, Coach } from './types';
import { useNavigate } from 'react-router-dom';

interface TeamRosterTabProps {
    roster: {
        players: Player[];
        coaches: Coach[];
        player_count: number;
        coach_count: number;
    } | null;
    error: string | null;
    onRetry: () => void;
}

export default function TeamRosterTab({ roster, error, onRetry }: TeamRosterTabProps) {
    const navigate = useNavigate();

    useEffect(() => {
            // Scroll to top when component mounts
            window.scrollTo(0, 0);
    
            // Also scroll to top when playerId changes
            return () => {
                // Optional: Cleanup if needed
            };
        });

    // Normalize position to G, F, or C
    const normalizePosition = (position: string): string => {
        if (!position) return 'Unknown';

        const posUpper = position.toUpperCase();

        // Guards
        if (posUpper.includes('G')) {
            if (posUpper.includes('PG') || posUpper.includes('POINT')) return 'G';
            if (posUpper.includes('SG') || posUpper.includes('SHOOTING')) return 'G';
            if (posUpper.includes('G-F') || posUpper.includes('F-G')) {
                // G-F goes to F, F-G goes to G
                if (posUpper.includes('G-F')) return 'F';
                if (posUpper.includes('F-G')) return 'F';
            }
            return 'G';
        }

        // Forwards
        if (posUpper.includes('F')) {
            if (posUpper.includes('SF') || posUpper.includes('SMALL')) return 'F';
            if (posUpper.includes('PF') || posUpper.includes('POWER')) return 'F';
            if (posUpper.includes('F-C') || posUpper.includes('C-F')) {
                // F-C goes to C, C-F goes to C
                if (posUpper.includes('F-C')) return 'C';
                if (posUpper.includes('C-F')) return 'C';
            }
            return 'F';
        }

        // Centers
        if (posUpper.includes('C')) {
            return 'C';
        }

        // Default mapping for unknown positions
        return position;
    };

    // Get position display name
    const getPositionDisplayName = (normalizedPosition: string): string => {
        switch (normalizedPosition) {
            case 'G': return 'Guards';
            case 'F': return 'Forwards';
            case 'C': return 'Centers';
            default: return normalizedPosition;
        }
    };

    // Get position order for sorting
    const getPositionOrder = (position: string): number => {
        switch (position) {
            case 'G': return 1;
            case 'F': return 2;
            case 'C': return 3;
            default: return 4;
        }
    };

    // Get player image with fallback
    const getPlayerImage = (playerId: number) => {
        return `http://127.0.0.1:5000/api/player/${playerId}/image`;
    };

    // Format height display
    const formatHeight = (height: string) => {
        if (height.includes("'")) return height; // Already formatted
        if (height.includes('-')) {
            const [feet, inches] = height.split('-');
            return `${feet}'${inches}"`;
        }
        return height;
    };

    // Get experience display
    const getExperienceDisplay = (exp: string) => {
        if (exp === 'Rookie' || exp === '0') return 'Rookie';
        if (exp === '1') return '1st Year';
        if (!isNaN(Number(exp))) return `${exp} Years`;
        return exp;
    };

    // Get original position with multi-position indicators
    const getOriginalPosition = (player: Player): string => {
        const pos = player.position || '';
        if (pos.includes('-')) {
            return pos; // Keep G-F, F-C, etc. as is
        }
        return pos;
    };

    // Handle player click
    const handlePlayerClick = (playerId: number, playerName: string) => {
        navigate(`/player/${playerId}/${encodeURIComponent(playerName)}`, {
            state: { fromPlayerProfile: true }
        });
    };

    if (!roster) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-400">Roster data not available</p>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                <button
                    onClick={onRetry}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Group players by normalized position
    const groupedPlayers = roster.players.reduce((acc: Record<string, Player[]>, player) => {
        const normalizedPosition = normalizePosition(player.position);
        if (!acc[normalizedPosition]) {
            acc[normalizedPosition] = [];
        }
        acc[normalizedPosition].push(player);
        return acc;
    }, {});

    // Sort positions: G, F, C, then others
    const sortedPositions = Object.keys(groupedPlayers).sort((a, b) => {
        const orderA = getPositionOrder(a);
        const orderB = getPositionOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b);
    });

    // Sort players within each group by jersey number
    sortedPositions.forEach(position => {
        groupedPlayers[position].sort((a, b) => {
            const numA = parseInt(a.jersey_number) || 999;
            const numB = parseInt(b.jersey_number) || 999;
            return numA - numB;
        });
    });

    // Separate head coach and assistants - FIXED: was using assistantCoaches[0] for head coach
    const headCoach = roster.coaches.find(coach => !coach.is_assistant);
    const assistantCoaches = roster.coaches.filter(coach => coach.is_assistant);

    return (
        <div className="border-2 border-blue-400 rounded-2xl min-h-[50vh] bg-[#1d1d1d] p-6">
            <h3 className="text-xl font-bold text-white mb-6">Team Roster</h3>

            {/* Coaching Staff Section */}
            {(headCoach || assistantCoaches.length > 0) && (
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-white mb-4">Coaching Staff</h4>

                    {headCoach && (
                        <div className="mb-4">
                            <div className="flex items-center bg-gradient-to-r from-blue-900/20 to-blue-800/10 p-4 rounded-lg border border-blue-700/30">
                                <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                                    <span className="text-blue-400 font-bold">HC</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h5 className="font-bold text-white text-lg">{assistantCoaches[0].coach_name}</h5>
                                            <p className="text-gray-400 text-sm">Head Coach</p>
                                        </div>
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
                                            Head Coach
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Players Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-white">Players ({roster.player_count})</h4>
                    <div className="flex space-x-4">
                        {sortedPositions.map(position => (
                            <div key={position} className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${position === 'G' ? 'bg-blue-500' :
                                    position === 'F' ? 'bg-green-500' :
                                        position === 'C' ? 'bg-purple-500' : 'bg-gray-500'
                                    }`}></div>
                                <span className="text-gray-300 text-sm">
                                    {getPositionDisplayName(position)} ({groupedPlayers[position].length})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {sortedPositions.length > 0 ? (
                    sortedPositions.map(position => (
                        <div key={position} className="mb-8">
                            <div className="flex items-center mb-4">
                                <div className={`w-5 h-5 rounded-full mr-3 ${position === 'G' ? 'bg-blue-500' :
                                    position === 'F' ? 'bg-green-500' :
                                        position === 'C' ? 'bg-purple-500' : 'bg-gray-500'
                                    }`}></div>
                                <h5 className="text-xl font-bold text-white">{getPositionDisplayName(position)}</h5>
                                <span className="ml-3 px-3 py-1 bg-[#2a2a2a] text-gray-300 text-sm rounded-full">
                                    {groupedPlayers[position].length} players
                                </span>
                            </div>

                            {/* Table for this position group */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-gray-400 border-b border-gray-700">
                                            <th className="pb-3 w-16 pl-4">#</th>
                                            <th className="pb-3 min-w-[180px]">Player</th>
                                            <th className="pb-3 w-32">Position</th>
                                            <th className="pb-3 w-24">Height</th>
                                            <th className="pb-3 w-24">Weight</th>
                                            <th className="pb-3 w-20">Age</th>
                                            <th className="pb-3 w-32">Experience</th>
                                            <th className="pb-3 w-48 pr-4">College</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedPlayers[position].map(player => (
                                            <tr
                                                key={player.player_id}
                                                className="border-b border-gray-800 hover:bg-gray-800/50 transition cursor-pointer group"
                                                onClick={() => handlePlayerClick(player.player_id, player.player_name)}
                                            >
                                                <td className="py-4 pl-4 w-16">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 group-hover:bg-gray-600 transition">
                                                            <span className="font-bold text-sm text-white">#{player.jersey_number}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 min-w-[180px]">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 overflow-hidden shrink-0 group-hover:bg-gray-600 transition">
                                                            <img
                                                                src={getPlayerImage(player.player_id)}
                                                                alt={player.player_name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    const parent = e.currentTarget.parentElement;
                                                                    if (parent) {
                                                                        const initials = player.player_name
                                                                            .split(' ')
                                                                            .map(n => n[0])
                                                                            .join('')
                                                                            .toUpperCase()
                                                                            .substring(0, 2);
                                                                        parent.innerHTML = `
                                                                            <span class="font-bold text-sm">${initials}</span>
                                                                        `;
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-white group-hover:text-blue-400 transition truncate">{player.player_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 w-32">
                                                    <div className="flex items-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${position === 'G' ? 'bg-blue-500/20 text-blue-400' :
                                                            position === 'F' ? 'bg-green-500/20 text-green-400' :
                                                                position === 'C' ? 'bg-purple-500/20 text-purple-400' :
                                                                    'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {position}
                                                        </span>
                                                        {player.position.includes('-') && (
                                                            <span className="ml-2 text-xs text-gray-400 truncate">
                                                                ({getOriginalPosition(player)})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 w-24 text-white">{formatHeight(player.height)}</td>
                                                <td className="py-4 w-24 text-white">{player.weight}</td>
                                                <td className="py-4 w-20 text-white">{player.age || 'N/A'}</td>
                                                <td className="py-4 w-32">
                                                    <span className="text-white">{getExperienceDisplay(player.experience)}</span>
                                                </td>
                                                <td className="py-4 w-48 pr-4 text-white truncate">{player.college}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">No roster data available</div>
                    </div>
                )}
            </div>
        </div>
    );
}