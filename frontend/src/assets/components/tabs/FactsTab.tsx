import type { Stats } from '../types/index.ts';

interface FactsTabProps {
    Team1All: Stats;
    Team2All: Stats;
}

export default function FactsTab({ Team1All, Team2All }: FactsTabProps) {
    
    return (
        <div>
            <div className='flex justify-center'><h1 className='text-white'>Statistics</h1></div>
            <div className='text-white flex flex-row'>
                <div className='w-full border-2 border-green-400 min-h-[20vh]'>
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
                                style={{
                                    width: `${(Team1All.ft_made / (Team1All.ft_attempted + Team2All.ft_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-red-400"
                                style={{
                                    width: `${((Team1All.ft_attempted - Team1All.ft_made) / (Team1All.ft_attempted + Team2All.ft_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.ft_made / (Team1All.ft_attempted + Team2All.ft_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-400"
                                style={{
                                    width: `${((Team2All.ft_attempted - Team2All.ft_made) / (Team1All.ft_attempted + Team2All.ft_attempted)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
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
                                style={{
                                    width: `${(Team1All.three_pt_made / (Team1All.three_pt_attempted + Team2All.three_pt_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-red-400"
                                style={{
                                    width: `${((Team1All.three_pt_attempted - Team1All.three_pt_made) / (Team1All.three_pt_attempted + Team2All.three_pt_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.three_pt_made / (Team1All.three_pt_attempted + Team2All.three_pt_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-400"
                                style={{
                                    width: `${((Team2All.three_pt_attempted - Team2All.three_pt_made) / (Team1All.three_pt_attempted + Team2All.three_pt_attempted)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

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
                                style={{
                                    width: `${(Team1All.fg_made / (Team1All.fg_attempted + Team2All.fg_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-red-400"
                                style={{
                                    width: `${((Team1All.fg_attempted - Team1All.fg_made) / (Team1All.fg_attempted + Team2All.fg_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.fg_made / (Team1All.fg_attempted + Team2All.fg_attempted)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-400"
                                style={{
                                    width: `${((Team2All.fg_attempted - Team2All.fg_made) / (Team1All.fg_attempted + Team2All.fg_attempted)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

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
                                    width: `${(Team1All.total_rebounds / (Team1All.total_rebounds + Team2All.total_rebounds)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.total_rebounds / (Team1All.total_rebounds + Team2All.total_rebounds)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
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
                                        width: `${(Team1All.offensive_rebounds / (Team1All.offensive_rebounds + Team2All.offensive_rebounds)) * 100}%`,
                                    }}
                                />
                                <div
                                    className="bg-red-400"
                                    style={{
                                        width: `${(((Team1All.offensive_rebounds + Team2All.offensive_rebounds) - Team1All.offensive_rebounds) / (Team1All.offensive_rebounds + Team2All.offensive_rebounds)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-center w-4/5 overflow-hidden rounded-full h-2.5">
                            <div className="flex w-6/10 overflow-hidden rounded-full h-2.5">
                                <div
                                    className="bg-blue-600"
                                    style={{
                                        width: `${(Team2All.offensive_rebounds / (Team1All.offensive_rebounds + Team2All.offensive_rebounds)) * 100}%`,
                                    }}
                                />
                                <div
                                    className="bg-blue-400"
                                    style={{
                                        width: `${(((Team1All.offensive_rebounds + Team2All.offensive_rebounds) - Team2All.offensive_rebounds) / (Team1All.offensive_rebounds + Team2All.offensive_rebounds)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
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
                                        width: `${(Team1All.defensive_rebounds / (Team1All.defensive_rebounds + Team2All.defensive_rebounds)) * 100}%`,
                                    }}
                                />
                                <div
                                    className="bg-red-400"
                                    style={{
                                        width: `${(((Team1All.defensive_rebounds + Team2All.defensive_rebounds) - Team1All.defensive_rebounds) / (Team1All.defensive_rebounds + Team2All.defensive_rebounds)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-center w-4/5 overflow-hidden rounded-full h-2.5">
                            <div className="flex w-6/10 overflow-hidden rounded-full h-2.5">
                                <div
                                    className="bg-blue-600"
                                    style={{
                                        width: `${(Team2All.defensive_rebounds / (Team1All.defensive_rebounds + Team2All.defensive_rebounds)) * 100}%`,
                                    }}
                                />
                                <div
                                    className="bg-blue-400"
                                    style={{
                                        width: `${(((Team1All.defensive_rebounds + Team2All.defensive_rebounds) - Team2All.defensive_rebounds) / (Team1All.defensive_rebounds + Team2All.defensive_rebounds)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
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
                                    width: `${(Team1All.assists / (Team1All.assists + Team2All.assists)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.assists / (Team1All.assists + Team2All.assists)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
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
                                    width: `${(Team1All.steals / (Team1All.steals + Team2All.steals)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.steals / (Team1All.steals + Team2All.steals)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
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
                                    width: `${(Team1All.blocks / (Team1All.blocks + Team2All.blocks)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.blocks / (Team1All.blocks + Team2All.blocks)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
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
                                    width: `${(Team1All.personal_fouls / (Team1All.personal_fouls + Team2All.personal_fouls)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.personal_fouls / (Team1All.personal_fouls + Team2All.personal_fouls)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
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
                                    width: `${(Team1All.turnovers / (Team1All.turnovers + Team2All.turnovers)) * 100}%`,
                                }}
                            />
                            <div
                                className="bg-blue-600"
                                style={{
                                    width: `${(Team2All.turnovers / (Team1All.turnovers + Team2All.turnovers)) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}