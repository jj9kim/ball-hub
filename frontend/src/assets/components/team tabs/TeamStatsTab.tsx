import { useState } from "react";

type StatType = 'players' | 'teams';

export default function TeamStatsTab() {
  const [activeTab, setActiveTab] = useState<StatType>('players');

  return (
    <div>
      <div className="w-full text-white border-2 border-green-400 bg-[#1d1d1d] rounded-2xl">
        <button
          className={`ml-5 bg-[#a19f9f33] rounded-2xl pl-3 pr-3 pt-1 pb-1 mt-3 mb-3 ${activeTab === 'players' ? 'bg-white' : ''
            } ${activeTab === 'players' ? 'text-[#1d1d1d]' : ''} ${activeTab === 'players' ? '' : 'hover:bg-[#d9d9d933]'}`}
          onClick={() => setActiveTab('players')}
        >
          Players
        </button>
        <button
          className={`ml-5 bg-[#a19f9f33] rounded-2xl pl-3 pr-3 pt-1 pb-1 mt-3 mb-3 ${activeTab === 'teams' ? 'bg-white' : ''
            } ${activeTab === 'teams' ? 'text-[#1d1d1d]' : ''} ${activeTab === 'teams' ? '' : 'hover:bg-[#d9d9d933]'}`}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
      </div>

      <div className="border-1 border-red-500 mt-3 min-h-10 w-full rounded-2xl bg-[#1d1d1d] p-4">
        {activeTab === 'players' ? (
          <div className="grid grid-cols-3 gap-4">
            {/* Player stats grid - 3x3 */}
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 min-h-20 flex items-center justify-center">
                Player Stat {index + 1}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* Team stats grid - 3x3 */}
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 min-h-20 flex items-center justify-center">
                Team Stat {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}