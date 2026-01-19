// assets/components/teamprofile/tabs/TeamMatchesTab.tsx
export default function TeamMatchesTab() {
    return (
        <div className="border-2 border-blue-400 rounded-2xl min-h-[50vh] bg-[#1d1d1d] p-6">
            <h3 className="text-xl font-bold text-white mb-4">Team Matches</h3>
            <p className="text-gray-400">Upcoming and past games will be displayed here.</p>
            <div className="mt-8 bg-[#2a2a2a] p-6 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-center">Match schedule coming soon...</p>
            </div>
        </div>
    );
}