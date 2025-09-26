import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTeamLogoUrl, getTeamName } from '../utils/teamMappings';
import { useEffect, useState } from "react";

interface Stats {
    player_id: number,
    player_name: string,
    player_name_short: string,
    position: string,
    position_sort: number,
    game_id: number,
    team_id: number,
    minutes: number,
    points: number,
    fg_made: number,
    fg_attempted: number,
    fg_percentage: number,
    three_pt_made: number,
    three_pt_attempted: number,
    three_pt_percentage: number,
    ft_made: number,
    ft_attempted: number,
    ft_percentage: number,
    offensive_rebounds: number,
    defensive_rebounds: number,
    total_rebounds: number,
    assists: number,
    steals: number,
    blocks: number,
    turnovers: number,
    personal_fouls: number,
    technical_fouls: number,
    ejected: number,
    ortg: number,
    usg: number,
    url: string,
    player_rating: number
}

export default function GamePage() {
    const [gameStats, setGameStats] = useState<Stats[]>([]);
    const { date, id } = useParams<{ date?: string; id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const teamsThisGame = location.state.teamsThisGame
    const teamStats = location.state.t

    useEffect(() => {
        fetch('http://localhost:8081/games')
            .then(res => res.json())
            .then((gameStats: Stats[]) => setGameStats(gameStats))
            .catch(err => console.log(err));
    }, []);

    const getStatsForTeams = () => {
        const statsPerTeam = gameStats.filter(g => g.game_id === Number(id));
        const Team1 = statsPerTeam.filter(s => s.team_id === teamsThisGame[0].team_id)
        const Team2 = statsPerTeam.filter(s => s.team_id === teamsThisGame[1].team_id)

        const allStats = teamStats.filter((s: Stats) => s.game_id === Number(id));
        const Team1All = allStats.find((g: Stats) => g.team_id === teamsThisGame[0].team_id);
        const Team2All = allStats.find((g: Stats) => g.team_id === teamsThisGame[1].team_id);

        function sumField(arr: any[], field: string): number {
            return arr.reduce((sum, obj) => sum + (obj[field] || 0), 0);
        }

        Team1All.fg_attempted = sumField(Team1, "fg_attempted");
        Team1All.fg_made = sumField(Team1, "fg_made");
        Team1All.ft_attempted = sumField(Team1, "ft_attempted");
        Team1All.ft_made = sumField(Team1, "ft_made");
        Team1All.three_pt_attempted = sumField(Team1, "three_pt_attempted");
        Team1All.three_pt_made = sumField(Team1, "three_pt_made");

        Team2All.fg_attempted = sumField(Team2, "fg_attempted");
        Team2All.fg_made = sumField(Team2, "fg_made");
        Team2All.ft_attempted = sumField(Team2, "ft_attempted");
        Team2All.ft_made = sumField(Team2, "ft_made");
        Team2All.three_pt_attempted = sumField(Team2, "three_pt_attempted");
        Team2All.three_pt_made = sumField(Team2, "three_pt_made");

        return { Team1, Team2, Team1All, Team2All }
    }

    const { Team1, Team2, Team1All, Team2All } = getStatsForTeams();

    console.log(Team2All.three_pt_made)

    // Fix: Parse the date correctly as local time
    const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        // This creates a date in LOCAL time, not UTC
        return new Date(year, month - 1, day);
    };

    const formatDateForURL = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleBack = () => {
        if (date) {
            navigate(`/${date}`);
        } else {
            const today = new Date();
            const todayString = formatDateForURL(today);
            navigate(`/${todayString}`);
        }
    };

    const displayDate = date ? parseLocalDate(date) : null;


    return (
        <div className='w-full flex flex-row justify-center'>
            <div className='w-2/3 min-h-[80vh]'>
                <div className="bg-[#1d1d1d] text-white flex flex-col mt-25 border-2 border-red-500 rounded-2xl mr-5">
                    <div className="grid grid-cols-3 items-center pb-5 pt-5 border-b-2 border-b-[#5b5b5b33]">
                        {/* Left button */}
                        <div className="flex justify-start">
                            <button
                                onClick={handleBack}
                                className="px-4 rounded hover:underline hover:font-bold"
                            >
                                ← Games
                            </button>
                        </div>

                        {/* Center logo + text */}
                        <div className="flex flex-row items-center justify-center">
                            <img
                                src="https://content.rotowire.com/images/teamlogo/basketball/100fa.png?v=7"
                                alt="NBA"
                                className="w-8 h-8"
                            />
                            <p className="ml-2">NBA</p>
                        </div>

                        {/* Right button */}
                        <div className="flex justify-end pr-5">
                            <button className="hover:font-bold hover:underline">Follow</button>
                        </div>
                    </div>
                    <div className='pt-3 pb-3 flex justify-center'>
                        {displayDate && (
                            <p className="text-gray-400 text-xs">
                                {displayDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        )}
                    </div>
                    <div className='border-b-2 border-b-[#5b5b5b33]'></div>
                    <div className="flex flex-col w-full pt-5">
                        <div className='flex flex-row pb-10 justify-center'>
                            {/* Team 1 */}
                            <div className="flex items-center mr-10">
                                <p className="mr-5 text-white text-2xl">{getTeamName(teamsThisGame[0].team_id)}</p>
                                <img
                                    src={getTeamLogoUrl(teamsThisGame[0].team_id)}
                                    alt={teamsThisGame[0].team_id.toString()}
                                    className="w-16 h-16 mr-7"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>

                            {/* Scores - Centered */}
                            <div className="flex flex-col pb-5 items-center">
                                <div className="flex items-center gap-2">
                                    <p className="text-white text-2xl">{teamsThisGame[0].points}</p>
                                    <span className="text-gray-400 text-2xl">-</span>
                                    <p className="text-white text-2xl">{teamsThisGame[1].points}</p>
                                </div>
                                <p className="text-gray-400 text-lg pt-5">Final</p>
                            </div>

                            {/* Team 2 */}
                            <div className="flex items-center ml-10">
                                <img
                                    src={getTeamLogoUrl(teamsThisGame[1].team_id)}
                                    alt={teamsThisGame[1].team_id.toString()}
                                    className="w-16 h-16 mr-7"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                <p className="text-white text-2xl">{getTeamName(teamsThisGame[1].team_id)}</p>
                            </div>
                        </div>
                    </div>
                    <div className='flex w-2/3 justify-between pb-5 pl-5'>
                        <button className='text-[#9f9f9f] hover:text-[#6f6f6f]'>Facts</button>
                        <button className='text-[#9f9f9f] hover:text-[#6f6f6f]'>Lineup</button>
                        <button className='text-[#9f9f9f] hover:text-[#6f6f6f]'>Table</button>
                        <button className='text-[#9f9f9f] hover:text-[#6f6f6f]'>Stats</button>
                    </div>
                </div>
                <div className='flex mt-5 border-2 border-blue-400 mr-5 min-h-[20vh] rounded-2xl bg-[#1d1d1d] flex-col'>
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
            </div>
            <div className='border-2 border-amber-400 w-1/5 mt-25 rounded-2xl bg-[#1d1d1d]'></div>
        </div>
    );
}