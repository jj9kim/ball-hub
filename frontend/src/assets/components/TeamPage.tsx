import { useState } from 'react';
import TeamTabNavigation from './TeamTabNavigation';

type TeamTabType = 'overview' | 'standings' | 'matches' | 'stats';

export default function TeamsPage() {
    const [activeTab, setActiveTab] = useState<TeamTabType>('overview');

    const handleTabClick = (tabKey: TeamTabType, index: number) => {
        setActiveTab(tabKey);
    };

    // Simple tab content - no API calls
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                        <p className="text-gray-400">Team overview content will go here</p>
                    </div>
                );
            case 'standings':
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Standings</h3>
                        <p className="text-gray-400">Standings content will go here</p>
                    </div>
                );
            case 'matches':
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Matches</h3>
                        <p className="text-gray-400">Matches content will go here</p>
                    </div>
                );
            case 'stats':
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Stats</h3>
                        <p className="text-gray-400">Stats content will go here</p>
                    </div>
                );
            default:
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                        <p className="text-gray-400">Team overview content will go here</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-black pt-20 flex justify-center">
            <div className='border-white border-2 w-7/8'>
                <div className="flex flex-col mb-6">
                    <div className='w-full bg-[#2c2c2c] rounded-2xl px-8 pt-8 border-2 border-pink-500'> 
                        <div className="flex items-center pb-10">
                            <img
                                src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7"
                                alt="NBA"
                                className="w-12 h-12 mr-4"
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-white">NBA</h1>
                                <p className='text-[#9f9f9f]'>North America</p>
                            </div>
                        </div>
                        <div className='-mb-1'>
                            {/* Tab Navigation */}
                            <TeamTabNavigation
                                activeTab={activeTab}
                                onTabClick={handleTabClick}
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] min-h-[50vh]">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}