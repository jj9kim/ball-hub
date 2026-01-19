// assets/components/teamprofile/tabs/TeamStatsTab.tsx
export default function TeamStatsTab() {
    return (
        <div className="border-2 border-blue-400 rounded-2xl min-h-[50vh] bg-[#1d1d1d] p-6">
            <h3 className="text-xl font-bold text-white mb-4">Team Statistics</h3>
            <p className="text-gray-400">Team statistics will be displayed here.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#2a2a2a] p-6 rounded-xl border border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4">Season Averages</h4>
                    <p className="text-gray-400">Coming soon...</p>
                </div>
                <div className="bg-[#2a2a2a] p-6 rounded-xl border border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4">Recent Performance</h4>
                    <p className="text-gray-400">Coming soon...</p>
                </div>
            </div>
        </div>
    );
}