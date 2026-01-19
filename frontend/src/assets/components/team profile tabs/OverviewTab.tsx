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
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] row-span-2 h-110">
                <div className="h-19"></div>
                <div className="relative h-90 bg-[#1d1d1d] rounded-2xl">
                    <div className="relative h-full bg-[#2c2c2c] overflow-hidden rounded-b-2xl">
                        {/* Court Base */}
                        <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                        {/* Baseline */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#343434]"></div>

                        {/* Three-Point Line (your original but vertical) */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                            <div className="w-[360px] h-[280px] border-4 border-[#343434] rounded-b-full rounded-l-3xl border-t-0"></div>
                        </div>

                        {/* Key/Paint Area (vertical version of your key) */}
                        <div className="absolute top-0 left-1/3 right-1/3 h-9/20 border-x-4 border-[#343434]"></div>

                        {/* Free Throw Line */}
                        <div className="absolute top-9/20 left-1/3 right-1/3 h-1 bg-[#343434]"></div>
                        {/* Free Throw Circle (your circle but half) */}
                        <div className="absolute top-7/20 left-1/2 w-20 h-20 border-4 border-[#343434] rounded-full transform -translate-x-1/2"></div>

                    </div>
                </div>
            </div>
            {/* Bottom wide (spans 2 columns) */}
            <div className="border-2 border-blue-400 rounded-2xl bg-[#1d1d1d] col-span-2 h-130">

            </div>
        </div>
    );
}