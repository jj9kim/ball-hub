import type { Stats } from '../types/index.ts';

interface FactsTabProps {
    Team1All: Stats | null;
    Team2All: Stats | null;
}

export default function FactsTab({ Team1All, Team2All }: FactsTabProps) {
    // Add null check at the beginning
    if (!Team1All || !Team2All) {
        return (
            <div className="text-white text-center py-8">
                No team statistics available
            </div>
        );
    }

    // Calculate percentages safely to avoid division by zero
    const calculatePercentage = (numerator: number, denominator: number): number => {
        return denominator > 0 ? numerator / denominator : 0;
    };

    // Helper function to calculate width percentages safely
    const getWidthPercentage = (teamValue: number, opponentValue: number): number => {
        const total = teamValue + opponentValue;
        return total > 0 ? (teamValue / total) * 100 : 50; // 50% if both are 0
    };

    const getFTWidths = () => {
        const totalAttempts = Team1All.ft_attempted + Team2All.ft_attempted;
        if (totalAttempts === 0) return { team1Made: 50, team1Missed: 0, team2Made: 50, team2Missed: 0 };

        return {
            team1Made: (Team1All.ft_made / totalAttempts) * 100,
            team1Missed: ((Team1All.ft_attempted - Team1All.ft_made) / totalAttempts) * 100,
            team2Made: (Team2All.ft_made / totalAttempts) * 100,
            team2Missed: ((Team2All.ft_attempted - Team2All.ft_made) / totalAttempts) * 100,
        };
    };

    const getThreePTWidths = () => {
        const totalAttempts = Team1All.three_pt_attempted + Team2All.three_pt_attempted;
        if (totalAttempts === 0) return { team1Made: 50, team1Missed: 0, team2Made: 50, team2Missed: 0 };

        return {
            team1Made: (Team1All.three_pt_made / totalAttempts) * 100,
            team1Missed: ((Team1All.three_pt_attempted - Team1All.three_pt_made) / totalAttempts) * 100,
            team2Made: (Team2All.three_pt_made / totalAttempts) * 100,
            team2Missed: ((Team2All.three_pt_attempted - Team2All.three_pt_made) / totalAttempts) * 100,
        };
    };

    const getFGWidths = () => {
        const totalAttempts = Team1All.fg_attempted + Team2All.fg_attempted;
        if (totalAttempts === 0) return { team1Made: 50, team1Missed: 0, team2Made: 50, team2Missed: 0 };

        return {
            team1Made: (Team1All.fg_made / totalAttempts) * 100,
            team1Missed: ((Team1All.fg_attempted - Team1All.fg_made) / totalAttempts) * 100,
            team2Made: (Team2All.fg_made / totalAttempts) * 100,
            team2Missed: ((Team2All.fg_attempted - Team2All.fg_made) / totalAttempts) * 100,
        };
    };

    const ftWidths = getFTWidths();
    const threePTWidths = getThreePTWidths();
    const fgWidths = getFGWidths();

    return (
        <div>
            <div className='flex justify-center'><h1 className='text-white'>Statistics</h1></div>
            <div className='text-white flex flex-row'>
                <div className='w-full border-2 border-green-400 min-h-[20vh]'>
                    {/* Free Throws */}
                    <div className='flex justify-between pt-5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.ft_made}/{Team1All.ft_attempted}
                            </p>
                        </div>
                        <p>FT</p>
                        <div className="flex justify-center">
                            <p className="bg-blue-600 text-white rounded-full px-5 py-1 mr-5">
                                {Team2All.ft_made}/{Team2All.ft_attempted}
                            </p>
                        </div>
                    </div>
                    <div className='flex justify-center'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{ width: `${ftWidths.team1Made}%` }}
                            />
                            <div
                                className="bg-red-400"
                                style={{ width: `${ftWidths.team1Missed}%` }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{ width: `${ftWidths.team2Made}%` }}
                            />
                            <div
                                className="bg-blue-400"
                                style={{ width: `${ftWidths.team2Missed}%` }}
                            />
                        </div>
                    </div>

                    {/* 3-Pointers */}
                    <div className='flex justify-between pt-5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.three_pt_made}/{Team1All.three_pt_attempted}
                            </p>
                        </div>
                        <p>3PT</p>
                        <div className="flex justify-center">
                            <p className="bg-blue-600 text-white rounded-full px-5 py-1 mr-5">
                                {Team2All.three_pt_made}/{Team2All.three_pt_attempted}
                            </p>
                        </div>
                    </div>
                    <div className='flex justify-center'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{ width: `${threePTWidths.team1Made}%` }}
                            />
                            <div
                                className="bg-red-400"
                                style={{ width: `${threePTWidths.team1Missed}%` }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{ width: `${threePTWidths.team2Made}%` }}
                            />
                            <div
                                className="bg-blue-400"
                                style={{ width: `${threePTWidths.team2Missed}%` }}
                            />
                        </div>
                    </div>

                    {/* Field Goals */}
                    <div className='flex justify-between pt-5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.fg_made}/{Team1All.fg_attempted}
                            </p>
                        </div>
                        <p>FG</p>
                        <div className="flex justify-center">
                            <p className="bg-blue-600 text-white rounded-full px-5 py-1 mr-5">
                                {Team2All.fg_made}/{Team2All.fg_attempted}
                            </p>
                        </div>
                    </div>
                    <div className='flex justify-center'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{ width: `${fgWidths.team1Made}%` }}
                            />
                            <div
                                className="bg-red-400"
                                style={{ width: `${fgWidths.team1Missed}%` }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{ width: `${fgWidths.team2Made}%` }}
                            />
                            <div
                                className="bg-blue-400"
                                style={{ width: `${fgWidths.team2Missed}%` }}
                            />
                        </div>
                    </div>

                    {/* Rebounds - with safety checks */}
                    <div className='flex justify-between pt-5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.total_rebounds}
                            </p>
                        </div>
                        <p>Rebounds</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.total_rebounds}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{
                                    width: `${getWidthPercentage(Team1All.total_rebounds, Team2All.total_rebounds)}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${getWidthPercentage(Team2All.total_rebounds, Team1All.total_rebounds)}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Offensive Rebounds */}
                    <div className='flex justify-between pt-1 pb-2.5'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.offensive_rebounds}
                            </p>
                        </div>
                        <p>Offensive Rebounds</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.offensive_rebounds}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex justify-center w-4/5 overflow-hidden rounded-full h-2.5">
                            <div className="flex w-6/10 overflow-hidden rounded-full h-2.5">
                                <div
                                    className="bg-red-600"
                                    style={{
                                        width: `${getWidthPercentage(Team1All.offensive_rebounds, Team2All.offensive_rebounds)}%`,
                                    }}
                                />
                                <div
                                    className="bg-red-400"
                                    style={{
                                        width: `${getWidthPercentage(Team2All.offensive_rebounds, Team1All.offensive_rebounds)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-center w-4/5 overflow-hidden rounded-full h-2.5">
                            <div className="flex w-6/10 overflow-hidden rounded-full h-2.5">
                                <div
                                    className="bg-blue-600"
                                    style={{
                                        width: `${getWidthPercentage(Team2All.offensive_rebounds, Team1All.offensive_rebounds)}%`,
                                    }}
                                />
                                <div
                                    className="bg-blue-400"
                                    style={{
                                        width: `${getWidthPercentage(Team1All.offensive_rebounds, Team2All.offensive_rebounds)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Defensive Rebounds */}
                    <div className='flex justify-between pt-1 pb-2.5'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.defensive_rebounds}
                            </p>
                        </div>
                        <p>Defensive Rebounds</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.defensive_rebounds}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex justify-center w-4/5 overflow-hidden rounded-full h-2.5">
                            <div className="flex w-6/10 overflow-hidden rounded-full h-2.5">
                                <div
                                    className="bg-red-600"
                                    style={{
                                        width: `${getWidthPercentage(Team1All.defensive_rebounds, Team2All.defensive_rebounds)}%`,
                                    }}
                                />
                                <div
                                    className="bg-red-400"
                                    style={{
                                        width: `${getWidthPercentage(Team2All.defensive_rebounds, Team1All.defensive_rebounds)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-center w-4/5 overflow-hidden rounded-full h-2.5">
                            <div className="flex w-6/10 overflow-hidden rounded-full h-2.5">
                                <div
                                    className="bg-blue-600"
                                    style={{
                                        width: `${getWidthPercentage(Team2All.defensive_rebounds, Team1All.defensive_rebounds)}%`,
                                    }}
                                />
                                <div
                                    className="bg-blue-400"
                                    style={{
                                        width: `${getWidthPercentage(Team1All.defensive_rebounds, Team2All.defensive_rebounds)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assists */}
                    <div className='flex justify-between pt-2.5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.assists}
                            </p>
                        </div>
                        <p>Assists</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.assists}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{
                                    width: `${getWidthPercentage(Team1All.assists, Team2All.assists)}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${getWidthPercentage(Team2All.assists, Team1All.assists)}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Steals */}
                    <div className='flex justify-between pt-2.5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.steals}
                            </p>
                        </div>
                        <p>Steals</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.steals}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{
                                    width: `${getWidthPercentage(Team1All.steals, Team2All.steals)}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${getWidthPercentage(Team2All.steals, Team1All.steals)}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Blocks */}
                    <div className='flex justify-between pt-2.5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.blocks}
                            </p>
                        </div>
                        <p>Blocks</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.blocks}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{
                                    width: `${getWidthPercentage(Team1All.blocks, Team2All.blocks)}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${getWidthPercentage(Team2All.blocks, Team1All.blocks)}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Fouls */}
                    <div className='flex justify-between pt-2.5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.personal_fouls}
                            </p>
                        </div>
                        <p>Fouls</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.personal_fouls}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{
                                    width: `${getWidthPercentage(Team1All.personal_fouls, Team2All.personal_fouls)}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${getWidthPercentage(Team2All.personal_fouls, Team1All.personal_fouls)}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Turnovers */}
                    <div className='flex justify-between pt-2.5 pb-3'>
                        <div className="flex justify-center">
                            <p className="bg-red-600 text-white rounded-full px-5 py-1 ml-5">
                                {Team1All.turnovers}
                            </p>
                        </div>
                        <p>Turnovers</p>
                        <div className='flex justify-center'>
                            <p className='bg-blue-600 rounded-full px-5 py-1 mr-5'>{Team2All.turnovers}</p>
                        </div>
                    </div>
                    <div className='flex justify-center pb-5'>
                        <div className="flex w-4/5 overflow-hidden rounded-full h-5">
                            <div
                                className="bg-red-600"
                                style={{
                                    width: `${getWidthPercentage(Team1All.turnovers, Team2All.turnovers)}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${getWidthPercentage(Team2All.turnovers, Team1All.turnovers)}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}