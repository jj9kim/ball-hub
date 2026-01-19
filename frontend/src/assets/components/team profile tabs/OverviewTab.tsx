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

export default function TeamOverviewTab({ teamInfo }: TeamOverviewTabProps) {
    const getTeamLogo = (teamId: number) => {
        return `http://127.0.0.1:5000/api/team-logo/${teamId}`;
    };

    return (
        <div className="grid grid-cols-3 grid-rows-[21vh_10px] gap-4 h-200">
            {/* Top left */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] h-40">
                <h2 className="ml-3 mt-3 text-white">Team Form</h2>
            </div>
            {/* Top middle */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] h-40">
                <h2 className="ml-3 mt-3 text-white">Next Match</h2>
            </div>
            {/* Right tall (spans both rows) */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] row-span-2 h-120">

            </div>
            {/* Bottom wide (spans 2 columns) */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] col-span-2 h-130">

            </div>
        </div>
    );
}