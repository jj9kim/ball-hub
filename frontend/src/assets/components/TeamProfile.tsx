// assets/components/TeamProfile.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TeamProfileTabNavigation from './TeamProfileTabNavigation';
import OverviewTab from './team profile tabs/OverviewTab'
import StandingsTab from './team profile tabs/StandingsTab'
import MatchesTab from './team profile tabs/MatchesTab'
import RosterTab from './team profile tabs/RosterTab'
import StatsTab from './team profile tabs/StatsTab'
import type { TeamBasicInfo, TeamProfileTabType, Player, Coach, RosterData } from './team profile tabs/types/index';

// Team ID to name mapping
const teamIdToName: Record<number, string> = {
    1610612737: 'Atlanta Hawks',
    1610612738: 'Boston Celtics',
    1610612739: 'Cleveland Cavaliers',
    1610612740: 'New Orleans Pelicans',
    1610612741: 'Chicago Bulls',
    1610612742: 'Dallas Mavericks',
    1610612743: 'Denver Nuggets',
    1610612744: 'Golden State Warriors',
    1610612745: 'Houston Rockets',
    1610612746: 'Los Angeles Clippers',
    1610612747: 'Los Angeles Lakers',
    1610612748: 'Miami Heat',
    1610612749: 'Milwaukee Bucks',
    1610612750: 'Minnesota Timberwolves',
    1610612751: 'Brooklyn Nets',
    1610612752: 'New York Knicks',
    1610612753: 'Orlando Magic',
    1610612754: 'Indiana Pacers',
    1610612755: 'Philadelphia 76ers',
    1610612756: 'Phoenix Suns',
    1610612757: 'Portland Trail Blazers',
    1610612758: 'Sacramento Kings',
    1610612759: 'San Antonio Spurs',
    1610612760: 'Oklahoma City Thunder',
    1610612761: 'Toronto Raptors',
    1610612762: 'Utah Jazz',
    1610612763: 'Memphis Grizzlies',
    1610612764: 'Washington Wizards',
    1610612765: 'Detroit Pistons',
    1610612766: 'Charlotte Hornets'
};

export default function TeamProfile() {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const [teamInfo, setTeamInfo] = useState<TeamBasicInfo | null>(null);
    const [roster, setRoster] = useState<RosterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TeamProfileTabType>('overview');

    useEffect(() => {
        if (teamId) {
            fetchTeamData(parseInt(teamId));
        }
    }, [teamId]);

    const handleTabClick = (tabKey: TeamProfileTabType, index: number) => {
        setActiveTab(tabKey);
    };

    const fetchTeamData = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            // Create basic team info from the ID
            const teamName = teamIdToName[id] || `Team ${id}`;
            const [city, name] = teamName.includes(' ') ? teamName.split(' ').slice(0, -1).join(' ') : ['Unknown', 'Team'];

            const basicInfo: TeamBasicInfo = {
                team_id: id,
                team_name: name,
                team_city: city,
                full_name: teamName
            };

            setTeamInfo(basicInfo);

            // Only fetch the roster (the endpoint that exists)
            const rosterResponse = await fetch(`http://127.0.0.1:5000/api/team/${id}/roster`);

            if (!rosterResponse.ok) {
                throw new Error(`Failed to fetch roster: ${rosterResponse.status}`);
            }

            const rosterData = await rosterResponse.json();

            if (!rosterData.success) {
                throw new Error(rosterData.error || 'Failed to load roster data');
            }

            setRoster(rosterData.roster);

        } catch (err) {
            console.error('Error fetching team data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch team information');

            // Even if roster fails, keep basic info
            if (teamId) {
                const id = parseInt(teamId);
                const teamName = teamIdToName[id] || `Team ${id}`;
                const [city, name] = teamName.includes(' ') ? teamName.split(' ').slice(0, -1).join(' ') : ['Unknown', 'Team'];

                setTeamInfo({
                    team_id: id,
                    team_name: name,
                    team_city: city,
                    full_name: teamName
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Get team logo with fallback
    const getTeamLogo = (teamId: number) => {
        return `http://127.0.0.1:5000/api/team-logo/${teamId}`;
    };

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab teamInfo={teamInfo!} roster={roster} />;
            case 'standings':
                return <StandingsTab teamInfo={teamInfo!} roster={roster} />;
            case 'matches':
                return <MatchesTab />;
            case 'roster':
                return <RosterTab roster={roster} error={error} onRetry={() => teamId && fetchTeamData(parseInt(teamId))} />;
            case 'stats':
                return <StatsTab />;
            default:
                return <OverviewTab teamInfo={teamInfo!} roster={roster} />;
        }
    };

    if (loading) {
        return (
            <div className="bg-black pt-20 flex justify-center min-h-screen">
                <div className='w-7/8 max-w-7xl'>
                    <div className="text-white text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-xl">Loading team profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!teamInfo) {
        return (
            <div className="bg-black pt-20 flex justify-center min-h-screen">
                <div className='w-7/8 max-w-7xl'>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-center">
                        <div className="text-red-400 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Team Not Found</h2>
                        <p className="text-gray-300 mb-6">Team ID: {teamId}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black pt-20 flex justify-center min-h-screen">
            <div className='border-white border-2 w-7/8 h-335'>
                <div className="flex flex-col mb-3">
                    <div className='w-full bg-[#1d1d1d] rounded-2xl px-8 pt-8 border-2 border-pink-500'>
                        <div className="flex items-center pb-10">
                            <img
                                src={getTeamLogo(teamInfo.team_id)}
                                alt={teamInfo.full_name}
                                className="w-16 h-16 mr-4 object-contain"
                                onError={(e) => {
                                    const abbreviation = teamInfo.team_name.split(' ').pop() || teamInfo.team_name.substring(0, 3).toUpperCase();
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        parent.innerHTML = `
                                            <div class="w-16 h-16 bg-gradient-to-br from-blue-900 to-purple-900 rounded-full flex items-center justify-center mr-4">
                                                <span class="text-2xl font-bold">${abbreviation.substring(0, 3)}</span>
                                            </div>
                                            <div>
                                                <h1 class="text-2xl font-bold text-white">${teamInfo.full_name}</h1>
                                                <p class='text-[#9f9f9f]'>${teamInfo.team_city}, USA</p>
                                            </div>
                                        `;
                                    }
                                }}
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-white">{teamInfo.full_name}</h1>
                                <p className='text-[#9f9f9f]'>{teamInfo.team_city}, USA</p>
                                {roster && (
                                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                        <span>{roster.player_count} Players</span>
                                        <span>•</span>
                                        <span>{roster.coach_count} Coaches</span>
                                        <span>•</span>
                                        <span>Team ID: {teamInfo.team_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='-mb-1'>
                            {/* Tab Navigation */}
                            <TeamProfileTabNavigation
                                activeTab={activeTab}
                                onTabClick={handleTabClick}
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}