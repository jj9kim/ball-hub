import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTeamLogoUrl, getTeamName } from '../utils/teamMappings';
import { useEffect, useState, useRef } from "react";

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

interface UnderlineStyle {
    width: number;
    left: number;
}

type TabType = 'facts' | 'lineup' | 'table' | 'stats';

export default function GamePage() {
    const [gameStats, setGameStats] = useState<Stats[]>([]);
    const { date, id } = useParams<{ date?: string; id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const teamsThisGame = location.state.teamsThisGame
    const teamStats = location.state.t

    const [activeTab, setActiveTab] = useState<TabType>('facts');
    const [underlineStyle, setUnderlineStyle] = useState<UnderlineStyle>({ width: 0, left: 0 });
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('http://localhost:8081/games')
            .then(res => res.json())
            .then((gameStats: Stats[]) => setGameStats(gameStats))
            .catch(err => console.log(err));
    }, []);

    const tabs: { key: TabType; label: string }[] = [
        { key: 'facts', label: 'Facts' },
        { key: 'lineup', label: 'Lineup' },
        { key: 'table', label: 'Table' },
        { key: 'stats', label: 'Stats' }
    ];

    useEffect(() => {
        buttonRefs.current = buttonRefs.current.slice(0, tabs.length);
        updateUnderlinePosition(0);
    }, [tabs.length]);

    const updateUnderlinePosition = (tabIndex: number) => {
        const activeButton = buttonRefs.current[tabIndex];
        const container = containerRef.current;

        if (!activeButton || !container) return;

        const buttonRect = activeButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setUnderlineStyle({
            width: buttonRect.width,
            left: buttonRect.left - containerRect.left,
        });
    };

    const handleTabClick = (tabKey: TabType, index: number) => {
        setActiveTab(tabKey);
        updateUnderlinePosition(index);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'facts':
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
            case 'lineup':
                return (
                    <div className="min-h-[100vh] rounded-2xl">
                        <div className='bg-[#343434] h-15 rounded-t-2xl'></div>
                        <div className='bg-[#2c2c2c] h-1'></div>
                        <div className='bg-[#343434] h-15'></div>
                        <div className="relative w-full mx-auto aspect-[3/2] bg-[#2c2c2c] overflow-hidden shadow-2xl">
                            {/* Court Base */}
                            <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                            {/* Half-Court Line */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#343434] transform -translate-x-1/2"></div>

                            {/* Center Circle */}
                            <div className="absolute top-1/2 left-1/2 w-28 h-28 border-4 border-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                            {/* Left Key/Paint Area */}
                            <div className="absolute top-1/2 w-60 h-50 border-4 border-[#343434] transform -translate-y-1/2 border-l-0"></div>

                            {/* Right Key/Paint Area */}
                            <div className="absolute top-1/2 right-0 w-60 h-50 border-4 border-[#343434] transform -translate-y-1/2 border-r-0"></div>

                            {/* Left Free Throw Circle */}
                            <div className="absolute top-1/2 left-41 w-36 h-36 border-4 border-[#343434] rounded-full transform -translate-y-1/2"></div>

                            {/* Right Free Throw Circle */}
                            <div className="absolute top-1/2 right-41 w-36 h-36 border-4 border-[#343434] rounded-full transform -translate-y-1/2"></div>

                            {/* Left Three-Point Line */}
                            <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                                <div className="relative">
                                    {/* Curved section */}
                                    <div className="pt-10 pb-10">
                                        <div className="w-90 h-130 border-4 border-l-0 border-[#343434] rounded-r-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Three-Point Line */}
                            <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                                <div className="relative">
                                    {/* Curved section */}
                                    <div className="pt-10 pb-10">
                                        <div className="w-90 h-130 border-4 border-r-0 border-[#343434] rounded-l-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'table':
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Table Content</h3>
                        <p className="text-gray-300">This is the table tab content. Display your data tables here.</p>
                    </div>
                );
            case 'stats':
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Stats Content</h3>
                        <p className="text-gray-300">This is the stats tab content. Show statistics and charts here.</p>
                    </div>
                );
            default:
                return (
                    <div className="p-6">
                        <p className="text-gray-300">Select a tab to view content.</p>
                    </div>
                );
        }
    };

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
                        <div className='grid grid-cols-[1fr_auto_1fr] items-center pb-10 px-10'>
                            {/* Team 1 - Left aligned but contained */}
                            <div className="flex items-center justify-end gap-4">
                                <p className="text-white text-2xl text-right whitespace-nowrap">
                                    {getTeamName(teamsThisGame[0].team_id)}
                                </p>
                                <img
                                    src={getTeamLogoUrl(teamsThisGame[0].team_id)}
                                    alt={teamsThisGame[0].team_id.toString()}
                                    className="w-16 h-16"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>

                            {/* Scores - Perfectly centered */}
                            <div className="flex flex-col items-center mx-4">
                                <div className="flex items-center gap-2">
                                    <p className="text-white text-2xl">{teamsThisGame[0].points}</p>
                                    <span className="text-gray-400 text-2xl">-</span>
                                    <p className="text-white text-2xl">{teamsThisGame[1].points}</p>
                                </div>
                                <p className="text-gray-400 text-lg pt-5">Final</p>
                            </div>

                            {/* Team 2 - Right aligned but contained */}
                            <div className="flex items-center justify-start gap-4">
                                <img
                                    src={getTeamLogoUrl(teamsThisGame[1].team_id)}
                                    alt={teamsThisGame[1].team_id.toString()}
                                    className="w-16 h-16"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                <p className="text-white text-2xl text-left whitespace-nowrap">
                                    {getTeamName(teamsThisGame[1].team_id)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        {/* Your existing tab navigation code */}
                        <div className="relative w-2/3">
                            <div ref={containerRef} className='flex justify-between pb-1 pl-5 relative'>
                                {tabs.map((tab, index) => (
                                    <button
                                        key={tab.key}
                                        ref={(el: HTMLButtonElement | null) => {
                                            buttonRefs.current[index] = el;
                                        }}
                                        className={`relative px-4 py-2 transition-colors duration-200 z-10 ${activeTab === tab.key
                                            ? 'text-white font-medium'
                                            : 'text-[#9f9f9f] hover:text-[#6f6f6f]'
                                            }`}
                                        onClick={() => handleTabClick(tab.key, index)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}

                                <div
                                    className="absolute bottom-0 h-1 rounded-t-full bg-white transition-all duration-300 ease-out"
                                    style={{
                                        width: `${underlineStyle.width}px`,
                                        left: `${underlineStyle.left}px`,
                                    }}
                                />
                            </div>

                            <div className='flex justify-between ml-4 rounded-t-full'>
                                {tabs.map((_, index) => (
                                    <div key={index} className='border-2 border-white opacity-0 flex-1' />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex mt-5 border-2 border-blue-400 mr-5 min-h-[20vh] rounded-2xl bg-[#1d1d1d] flex-col'>
                    {renderTabContent()}
                </div>
            </div>
            <div className='border-2 border-amber-400 w-1/5 mt-25 rounded-2xl bg-[#1d1d1d]'></div>
        </div>
    );
}