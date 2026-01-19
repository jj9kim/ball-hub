// assets/components/teamprofile/tabs/TeamRosterTab.tsx
import type { Player, Coach } from './types';

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
                if (posUpper.includes('F-G')) return 'G';
            }
            return 'G';
        }

        // Forwards
        if (posUpper.includes('F')) {
            if (posUpper.includes('SF') || posUpper.includes('SMALL')) return 'F';
            if (posUpper.includes('PF') || posUpper.includes('POWER')) return 'F';
            if (posUpper.includes('F-C') || posUpper.includes('C-F')) {
                // F-C goes to C, C-F goes to F
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

    return (
        <div className="border-2 border-blue-400 rounded-2xl min-h-[50vh] bg-[#1d1d1d] p-6">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Team Roster</h3>
                <div className="flex flex-wrap gap-4 mb-6">
                    {sortedPositions.map(position => (
                        <div key={position} className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${position === 'G' ? 'bg-blue-500' :
                                    position === 'F' ? 'bg-green-500' :
                                        position === 'C' ? 'bg-purple-500' : 'bg-gray-500'
                                }`}></div>
                            <span className="text-gray-300">
                                {getPositionDisplayName(position)} ({groupedPlayers[position].length})
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {sortedPositions.length > 0 ? (
                sortedPositions.map(position => (
                    <div key={position} className="mb-12">
                        <div className="flex items-center mb-6">
                            <div className={`w-6 h-6 rounded-full mr-3 ${position === 'G' ? 'bg-blue-500' :
                                    position === 'F' ? 'bg-green-500' :
                                        position === 'C' ? 'bg-purple-500' : 'bg-gray-500'
                                }`}></div>
                            <h4 className="text-2xl font-bold text-white">{getPositionDisplayName(position)}</h4>
                            <span className="ml-4 px-3 py-1 bg-[#2a2a2a] text-gray-300 text-sm rounded-full">
                                {groupedPlayers[position].length} players
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupedPlayers[position]
                                .sort((a, b) => {
                                    const numA = parseInt(a.jersey_number) || 999;
                                    const numB = parseInt(b.jersey_number) || 999;
                                    return numA - numB;
                                })
                                .map(player => (
                                    <div
                                        key={player.player_id}
                                        className="bg-[#2a2a2a] rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition group"
                                    >
                                        <div className="flex items-start">
                                            {/* Player Image */}
                                            <div className="relative mr-4">
                                                <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center border-2 border-gray-700 group-hover:border-blue-500 transition">
                                                    <img
                                                        src={getPlayerImage(player.player_id)}
                                                        alt={player.player_name}
                                                        className="w-full h-full rounded-full object-cover"
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
                                                                    <div class="w-full h-full rounded-full flex items-center justify-center bg-[#444]">
                                                                        <span class="text-lg font-bold">${initials}</span>
                                                                    </div>
                                                                `;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#333] rounded-full flex items-center justify-center border border-gray-700">
                                                    <span className="text-xs font-bold text-white">#{player.jersey_number}</span>
                                                </div>
                                            </div>

                                            {/* Player Info */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h5 className="font-bold text-lg text-white group-hover:text-blue-400 transition">
                                                            {player.player_name}
                                                        </h5>
                                                        <div className="flex items-center mt-1">
                                                            <span className={`text-xs px-2 py-1 rounded ${position === 'G' ? 'bg-blue-500/20 text-blue-400' :
                                                                    position === 'F' ? 'bg-green-500/20 text-green-400' :
                                                                        position === 'C' ? 'bg-purple-500/20 text-purple-400' :
                                                                            'bg-gray-500/20 text-gray-400'
                                                                }`}>
                                                                {position}
                                                            </span>
                                                            {player.position.includes('-') && (
                                                                <span className="ml-2 text-xs text-gray-400">
                                                                    ({getOriginalPosition(player)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Height</p>
                                                        <p className="font-medium text-white">{formatHeight(player.height)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Weight</p>
                                                        <p className="font-medium text-white">{player.weight}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Age</p>
                                                        <p className="font-medium text-white">{player.age || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Exp</p>
                                                        <p className="font-medium text-white">{getExperienceDisplay(player.experience)}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <p className="text-gray-500 text-xs">College</p>
                                                    <p className="font-medium text-sm text-white truncate">{player.college}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">No roster data available</div>
                </div>
            )}
        </div>
    );
}