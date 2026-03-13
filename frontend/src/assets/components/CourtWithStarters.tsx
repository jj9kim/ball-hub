// components/CourtWithStarters.tsx
import { useNavigate } from 'react-router-dom';

interface Player {
    player_id: number;
    name: string;
    position: string;
    jersey?: string;
    team_id: number;
}

interface CourtWithStartersProps {
    starters: Player[];
    loading?: boolean;
    error?: string | null;
    teamId: number;
    teamName: string;
}

export default function CourtWithStarters({ starters, loading, error, teamId, teamName }: CourtWithStartersProps) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="relative w-full mx-auto aspect-[3/2] bg-[#2c2c2c] shadow-2xl flex items-center justify-center">
                <div className="text-gray-400">Loading starters...</div>
            </div>
        );
    }

    if (error || !starters.length) {
        return (
            <div className="relative w-full mx-auto aspect-[3/2] bg-[#2c2c2c] shadow-2xl flex items-center justify-center">
                <div className="text-gray-500 text-sm">No starting lineup data available</div>
            </div>
        );
    }

    // Position mapping for court positions (adjusted for full court view)
    const courtPositions = [
        { position: 'PG', className: 'top-83/100 left-1/4 transform -translate-x-1/2 -translate-y-1/2' },
        { position: 'SG', className: 'top-70/100 left-1/3 transform -translate-x-1/2 -translate-y-1/2' },
        { position: 'SF', className: 'top-50/100 left-1/2 transform -translate-x-1/2 -translate-y-1/2' },
        { position: 'PF', className: 'top-30/100 left-2/3 transform -translate-x-1/2 -translate-y-1/2' },
        { position: 'C', className: 'top-17/100 left-3/4 transform -translate-x-1/2 -translate-y-1/2' }
    ];

    return (
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

                {/* Dynamic Starters - Player Cards */}
                {courtPositions.map(({ position, className }) => {
                    const player = starters.find(p => p.position === position);
                    if (!player) return null;

                    return (
                        <div
                            key={position}
                            className={`absolute ${className} cursor-pointer hover:scale-110 transition-transform`}
                            onClick={() => navigate(`/player/${player.player_id}`)}
                        >
                            <div className="relative w-30 h-30 flex flex-col items-center transition-opacity whitespace-nowrap">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-amber-500 bg-white">
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
                                                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center border-2 border-amber-500">
                                                        <span class="text-xl font-bold text-white">${initials}</span>
                                                    </div>
                                                `;
                                            }
                                        }}
                                    />
                                </div>
                                <div className='flex flex-row justify-center mt-1'>
                                    <div className='text-[#ababab] text-[11px] pr-1'>
                                        #{player.jersey || ''}
                                    </div>
                                    <div className='text-white text-[11px]'>
                                        {player.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}