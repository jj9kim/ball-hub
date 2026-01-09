import { getTeamLogoUrl, getTeamName } from '../../utils/teamMappings';
import type { TabType, UnderlineStyle } from './types';
import { useRef, useEffect, useState } from 'react';

interface GameHeaderProps {
    date?: string;
    teamsThisGame: any[];
    onBack: () => void;
    activeTab: TabType;
    onTabClick: (tabKey: TabType, index: number) => void;
}

const tabs: { key: TabType; label: string }[] = [
    { key: 'facts', label: 'Facts' },
    { key: 'lineup', label: 'Lineup' },
    { key: 'table', label: 'Table' },
    { key: 'stats', label: 'Stats' }
];

export default function GameHeader({ date, teamsThisGame, onBack, activeTab, onTabClick }: GameHeaderProps) {
    const [underlineStyle, setUnderlineStyle] = useState<UnderlineStyle>({ width: 0, left: 0 });
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        buttonRefs.current = buttonRefs.current.slice(0, tabs.length);
        const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
        updateUnderlinePosition(activeIndex);
    }, [tabs.length, activeTab]);

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

    const handleTabClick = (tabKey: TabType, index: number) => {
        onTabClick(tabKey, index);
        updateUnderlinePosition(index);
    };

    const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const displayDate = date ? parseLocalDate(date) : null;

    return (
        <div className="bg-[#1d1d1d] text-white flex flex-col mt-25 border-2 border-red-500 rounded-2xl mr-5">
            <div className="grid grid-cols-3 items-center pb-5 pt-5 border-b-2 border-b-[#5b5b5b33]">
                {/* Left button */}
                <div className="flex justify-start">
                    <button
                        onClick={onBack}
                        className="px-4 rounded hover:underline hover:font-bold"
                    >
                        ← Games
                    </button>
                </div>

                {/* Center logo + text */}
                <div className="flex flex-row items-center justify-center">
                    <img
                        src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7"
                        alt="NBA"
                        className="w-8 h-8"
                    />
                    <p className="ml-2">NBA</p>
                </div>

                {/* Right button */}
                <div className="flex justify-end pr-5">
                    <button className="hover:font-bold hover:underline">Follow</button>
                </div>
            </div>

            <div className='pt-3 pb-3 flex justify-center'>
                {displayDate && (
                    <p className="text-gray-400 text-xs">
                        {displayDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                )}
            </div>

            <div className='border-b-2 border-b-[#5b5b5b33]'></div>

            <div className="flex flex-col w-full pt-5">
                <div className='grid grid-cols-[1fr_auto_1fr] items-center pb-10 px-10'>
                    {/* Team 1 */}
                    <div className="flex items-center justify-end gap-4">
                        <p className="text-white text-2xl text-right whitespace-nowrap">
                            {getTeamName(teamsThisGame[0].team_id)}
                        </p>
                        <img
                            src={`http://127.0.0.1:5000/api/team-logo/${teamsThisGame[0].team_id}`}
                            alt={teamsThisGame[0].team_name}
                            className="w-14 h-14 mr-5 ml-2"
                            onError={(e) => {
                                // Fallback: Show team abbreviation
                                const teamWords = teamsThisGame[0].team_name.split(' ');
                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                            <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                            </div>
                                            <span>${teamsThisGame[0].team_name}</span>
                                        `;
                                }
                            }}
                        />
                    </div>

                    {/* Scores */}
                    <div className="flex flex-col items-center mx-4">
                        <div className="flex items-center gap-2">
                            <p className="text-white text-2xl">{teamsThisGame[0].points}</p>
                            <span className="text-gray-400 text-2xl">-</span>
                            <p className="text-white text-2xl">{teamsThisGame[1].points}</p>
                        </div>
                        <p className="text-gray-400 text-lg pt-5">Final</p>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-start gap-4">
                        <img
                            src={`http://127.0.0.1:5000/api/team-logo/${teamsThisGame[1].team_id}`}
                            alt={teamsThisGame[1].team_name}
                            className="w-14 h-14 ml-5 mr-2"
                            onError={(e) => {
                                // Fallback: Show team abbreviation
                                const teamWords = teamsThisGame[0].team_name.split(' ');
                                const teamAbbreviation = teamWords[teamWords.length - 1];
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                            <div class="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-xs font-bold">${teamAbbreviation.substring(0, 2)}</span>
                                            </div>
                                            <span>${teamsThisGame[1].team_name}</span>
                                        `;
                                }
                            }}
                        />
                        <p className="text-white text-2xl text-left whitespace-nowrap">
                            {getTeamName(teamsThisGame[1].team_id)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation with proper underline */}
            <div className="w-full">
                <div className="w-2/3">
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