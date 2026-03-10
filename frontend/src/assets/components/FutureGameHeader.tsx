import React from 'react';
import type { FullScheduleGame } from '../../api/nbaService';

interface FutureGameHeaderProps {
    game: FullScheduleGame;
}

export type TabType = 'preview' | 'table' | 'stats';

const tabs: { key: TabType; label: string }[] = [
    { key: 'preview', label: 'Preview' },
    { key: 'table', label: 'Table' },
    { key: 'stats', label: 'Stats' }
];

// Helper function to format time from ISO string
export const formatGameTime = (timeStr: string | undefined): string => {
    if (!timeStr) return 'TBD';

    try {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return 'TBD';

        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();

        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        const minuteStr = minutes.toString().padStart(2, '0');

        return `${hour12}:${minuteStr} ${ampm}`;
    } catch (error) {
        return 'TBD';
    }
};

export default function FutureGameHeader({ game }: FutureGameHeaderProps) {
    return (
        <>
            {/* Arena Information */}
            <div className='pt-3 pb-3 flex justify-center'>
                <p className="text-gray-400 text-xs">
                    {game.arenaName || 'Arena TBD'} • {game.arenaCity || ''} {game.arenaState || ''}
                </p>
            </div>

            <div className='border-b-2 border-b-[#5b5b5b33]'></div>

            <div className="flex flex-col w-full pt-5">
                <div className='grid grid-cols-[1fr_auto_1fr] items-center pb-10 px-10'>
                    {/* Home Team */}
                    <div className="flex items-center justify-end gap-4">
                        <p className="text-white text-2xl text-right whitespace-nowrap">
                            {game.homeTeam_teamName}
                        </p>
                        <img
                            src={`http://127.0.0.1:5000/api/team-logo/${game.homeTeam_teamId}`}
                            alt={game.homeTeam_teamName}
                            className="w-14 h-14 mr-5 ml-2"
                            onError={(e) => {
                                const teamWords = game.homeTeam_teamName.split(' ');
                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                    <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                    </div>
                                    <span>${game.homeTeam_teamName}</span>
                                `;
                                }
                            }}
                        />
                    </div>

                    {/* Game Time */}
                    <div className="flex flex-col items-center mx-4">
                        <div className="flex items-center gap-2">
                            <p className="text-white text-2xl font-semibold">
                                {formatGameTime(game.gameTimeEst)}
                            </p>
                        </div>
                        <p className="text-gray-400 text-lg pt-5">Scheduled</p>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-start gap-4">
                        <img
                            src={`http://127.0.0.1:5000/api/team-logo/${game.awayTeam_teamId}`}
                            alt={game.awayTeam_teamName}
                            className="w-14 h-14 ml-5 mr-2"
                            onError={(e) => {
                                const teamWords = game.awayTeam_teamName.split(' ');
                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                    <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                    </div>
                                    <span>${game.awayTeam_teamName}</span>
                                `;
                                }
                            }}
                        />
                        <p className="text-white text-2xl text-left whitespace-nowrap">
                            {game.awayTeam_teamName}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}