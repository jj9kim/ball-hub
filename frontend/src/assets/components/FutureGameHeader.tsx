import React, { useRef, useEffect, useState } from 'react';
import type { FullScheduleGame } from '../../api/nbaService';
import type { FutureTabType } from '../GamePage';

interface FutureGameHeaderProps {
    game: FullScheduleGame;
    date?: string;
    teamsThisGame: Array<{ team_id: number; team_name: string; points: number }>;
    onBack: () => void;
    activeTab: FutureTabType;
    onTabClick: (tabKey: FutureTabType, index: number) => void;
    isFutureGame: boolean;
    tabs: { key: FutureTabType; label: string }[];
}

interface UnderlineStyle {
    width: number;
    left: number;
}

export default function FutureGameHeader({
    game,
    date,
    teamsThisGame,
    onBack,
    activeTab,
    onTabClick,
    isFutureGame,
    tabs
}: FutureGameHeaderProps) {

    const [underlineStyle, setUnderlineStyle] = useState<UnderlineStyle>({ width: 0, left: 0 });
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        buttonRefs.current = buttonRefs.current.slice(0, tabs.length);
        const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
        updateUnderlinePosition(activeIndex);
    }, [activeTab, tabs]);

    const updateUnderlinePosition = (tabIndex: number) => {
        const activeButton = buttonRefs.current[tabIndex];
        const container = containerRef.current;

        if (!activeButton || !container) return;

        const buttonRect = activeButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setUnderlineStyle({
            width: buttonRect.width,
            left: buttonRect.left - containerRect.left,
        });
    };

    const handleTabClick = (tabKey: FutureTabType, index: number) => {
        onTabClick(tabKey, index);
        updateUnderlinePosition(index);
    };

    const formatGameTime = (timeStr: string | undefined): string => {
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

    return (
        <div className="bg-[#1d1d1d] text-white flex flex-col mt-25 border-2 border-red-500 rounded-2xl mr-5">
            {/* Header with back button, logo, follow button */}
            <div className="grid grid-cols-3 items-center pb-5 pt-5 border-b-2 border-b-[#5b5b5b33]">
                <div className="flex justify-start">
                    <button onClick={onBack} className="px-4 rounded hover:underline hover:font-bold">
                        ← Games
                    </button>
                </div>
                <div className="flex flex-row items-center justify-center">
                    <img src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7" alt="NBA" className="w-8 h-8" />
                    <p className="ml-2">NBA</p>
                </div>
                <div className="flex justify-end pr-5">
                    <button className="hover:font-bold hover:underline">Follow</button>
                </div>
            </div>

            {/* Arena Information */}
            <div className='pt-3 pb-3 flex justify-center border-b-2 border-b-[#5b5b5b33]'>
                <p className="text-gray-400 text-xs">
                    {game.arenaName || 'Arena TBD'} • {game.arenaCity || ''} {game.arenaState || ''}
                </p>
            </div>

            {/* Teams and Game Time */}
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
                                        <div class="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center mr-5 ml-2">
                                            <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                        </div>
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
                                        <div class="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center ml-5 mr-2">
                                            <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                        </div>
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

            {/* Tab Navigation with underline - matching GameHeader style */}
            <div className="w-full mt-4">
                <div className="w-1/2">
                    <div ref={containerRef} className='flex justify-between pl-5 relative'>
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.key}
                                ref={(el: HTMLButtonElement | null) => {
                                    buttonRefs.current[index] = el;
                                }}
                                className={`relative px-4 py-2 transition-colors duration-200 z-10 ${activeTab === tab.key
                                        ? 'text-white font-medium'
                                        : 'text-[#9f9f9f] hover:text-[#6f6f6f]'
                                    }`}
                                onClick={() => handleTabClick(tab.key, index)}
                            >
                                {tab.label}
                            </button>
                        ))}

                        {/* Underline */}
                        <div
                            className="absolute bottom-0 h-1 rounded-t-full bg-white transition-all duration-300 ease-out"
                            style={{
                                width: `${underlineStyle.width}px`,
                                left: `${underlineStyle.left}px`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}