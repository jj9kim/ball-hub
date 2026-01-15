// TeamProfileTabNavigation.tsx
import { useState, useRef, useEffect } from 'react';

type TeamProfileTabType = 'overview' | 'standings' | 'matches' | 'roster' | 'stats';

interface TeamProfileTabNavigationProps {
    activeTab: TeamProfileTabType;
    onTabClick: (tabKey: TeamProfileTabType, index: number) => void;
}

const tabs: { key: TeamProfileTabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'standings', label: 'Standings' },
    { key: 'matches', label: 'Matches' },
    { key: 'roster', label: 'Roster' },
    { key: 'stats', label: 'Stats' }
];

interface UnderlineStyle {
    width: number;
    left: number;
}

export default function TeamProfileTabNavigation({ activeTab, onTabClick }: TeamProfileTabNavigationProps) {
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

    const handleTabClick = (tabKey: TeamProfileTabType, index: number) => {
        onTabClick(tabKey, index);
        updateUnderlinePosition(index);
    };

    return (
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

                    <div
                        className="absolute bottom-0 h-1 rounded-t-full bg-white transition-all duration-300 ease-out"
                        style={{
                            width: `${underlineStyle.width}px`,
                            left: `${underlineStyle.left}px`,
                        }}
                    />
                </div>

                <div className='flex justify-between ml-4 rounded-t-full'>
                    {tabs.map((_, index) => (
                        <div key={index} className='border-2 border-white opacity-0 flex-1' />
                    ))}
                </div>
            </div>
        </div>
    );
}