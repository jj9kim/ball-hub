// assets/components/teamprofile/tabs/TeamOverviewTab.tsx
interface TeamOverviewTabProps {
    teamInfo: {
        team_id: number;
        team_name: string;
        team_city: string;
        full_name: string;
    };
    roster: {
        players: any[];
        coaches: any[];
        player_count: number;
        coach_count: number;
    } | null;
}

export default function TeamOverviewTab({ teamInfo, roster }: TeamOverviewTabProps) {
    const getTeamLogo = (teamId: number) => {
        return `http://127.0.0.1:5000/api/team-logo/${teamId}`;
    };

    return (
        <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Team Overview</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Team Info Card */}
                <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4">Team Information</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Full Name:</span>
                            <span className="font-medium text-white">{teamInfo.full_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Location:</span>
                            <span className="font-medium text-white">{teamInfo.team_city}, USA</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Team ID:</span>
                            <span className="font-medium text-white">{teamInfo.team_id}</span>
                        </div>
                    </div>
                </div>

                {/* Roster Summary Card */}
                {roster && (
                    <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-bold text-white mb-4">Roster Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Total Players:</span>
                                <span className="font-medium text-white">{roster.player_count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Coaching Staff:</span>
                                <span className="font-medium text-white">{roster.coach_count}</span>
                            </div>
                            {roster.coaches.length > 0 && (
                                <div className="pt-3 border-t border-gray-700">
                                    <p className="text-gray-400 mb-2">Head Coach:</p>
                                    <p className="font-medium text-white">
                                        {roster.coaches.find(c => !c.is_assistant)?.coach_name || 'Not Available'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
                <h4 className="text-lg font-bold text-white mb-4">Quick Facts</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                            {roster?.player_count || 0}
                        </div>
                        <p className="text-sm text-gray-400">Players</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">
                            {roster?.coach_count || 0}
                        </div>
                        <p className="text-sm text-gray-400">Coaches</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                            {teamInfo.team_id ? 'NBA' : '-'}
                        </div>
                        <p className="text-sm text-gray-400">League</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400 mb-1">
                            2025-26
                        </div>
                        <p className="text-sm text-gray-400">Season</p>
                    </div>
                </div>
            </div>
        </div>
    );
}