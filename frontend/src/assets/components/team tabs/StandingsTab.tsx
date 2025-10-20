import type { Standings } from "../types";
import { useState, useEffect } from "react";
import { getTeamLogoUrlFromName } from "../../../utils/teamMappings";

interface AdvancedStandings {
    id: number,
    team_name: string,
    team_short: string,
    wins: number,
    losses: number,
    win_percentage: number,
    home_record: string,
    away_record: string,
    conference_record: string,
    conference_win_percentage: number,
    division_record: string,
    division_win_percentage: number,
    close_record: string,
    blowout_record: string,
    low_scoring_record: string,
    overtime_record: string
}

type TabType = 'league' | 'conference' | 'division' | 'situational';

export default function StandingsTab() {
    const [standings, setStandings] = useState<Standings[]>([]);
    const [advancedStandings, setAdvancedStandings] = useState<AdvancedStandings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('league');

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch basic standings
                const standingsResponse = await fetch('http://localhost:8081/basic_standings');
                if (!standingsResponse.ok) {
                    throw new Error('Failed to fetch basic standings');
                }
                const standingsData: Standings[] = await standingsResponse.json();

                // Fetch advanced splits
                const advancedResponse = await fetch('http://localhost:8081/advanced_splits');
                if (!advancedResponse.ok) {
                    throw new Error('Failed to fetch advanced splits');
                }
                const advancedData: AdvancedStandings[] = await advancedResponse.json();

                if (isMounted) {
                    setStandings(standingsData);
                    setAdvancedStandings(advancedData);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                    console.error('Fetch error:', err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Safe sorting with error handling - LEAGUE VIEW (default)
    const leagueStandings = standings
        .filter(team => team && typeof team.win_percentage === 'number')
        .sort((a, b) => {
            try {
                const diff = b.win_percentage - a.win_percentage;
                if (diff !== 0) return diff;

                const aConferenceRecord = a.conference_record || "0-0";
                const bConferenceRecord = b.conference_record || "0-0";

                const aConfWins = Number(aConferenceRecord.split("-")[0]) || 0;
                const bConfWins = Number(bConferenceRecord.split("-")[0]) || 0;

                return bConfWins - aConfWins;
            } catch (error) {
                console.error('Error sorting standings:', error);
                return 0;
            }
        });

    // CONFERENCE VIEW - group by conference and sort within each conference
    const conferenceStandings = () => {
        const eastern = standings.filter(team => team.conference === 'Eastern Conference')
            .sort((a, b) => b.win_percentage - a.win_percentage);
        const western = standings.filter(team => team.conference === 'Western Conference')
            .sort((a, b) => b.win_percentage - a.win_percentage);
        return { eastern, western };
    };

    // DIVISION VIEW - group by division and sort within each division
    const divisionStandings = () => {
        const divisions: { [key: string]: Standings[] } = {};

        standings.forEach(team => {
            if (team.division) {
                if (!divisions[team.division]) {
                    divisions[team.division] = [];
                }
                divisions[team.division].push(team);
            }
        });

        // Sort each division by win percentage
        Object.keys(divisions).forEach(division => {
            divisions[division].sort((a, b) => b.win_percentage - a.win_percentage);
        });

        return divisions;
    };

    // SITUATIONAL VIEW - use advanced standings data
    const situationalStandings = advancedStandings
        .filter(team => team && typeof team.win_percentage === 'number')
        .sort((a, b) => b.win_percentage - a.win_percentage);

    // Get the current standings based on active tab
    const getCurrentStandings = () => {
        switch (activeTab) {
            case 'conference':
                const conferences = conferenceStandings();
                return [...conferences.eastern, ...conferences.western];
            case 'division':
                const divisions = divisionStandings();
                return Object.values(divisions).flat();
            case 'situational':
                return situationalStandings;
            case 'league':
            default:
                return leagueStandings;
        }
    };

    // Get headers based on active tab
    const getHeaders = () => {
        const baseHeaders = ['#', 'Team', 'W', 'L', 'Win%', 'PF/G', 'PA/G', 'Diff', 'Streak'];

        switch (activeTab) {
            case 'situational':
                return ['#', 'Team', 'W', 'L', 'Win%', 'Home', 'Away', 'Close', 'Overtime'];
            default:
                return baseHeaders;
        }
    };

    // Get row data based on active tab
    const getRowData = (team: any, index: number) => {
        switch (activeTab) {
            case 'situational':
                return [
                    index + 1,
                    team.team_name,
                    team.wins,
                    team.losses,
                    team.win_percentage.toFixed(3),
                    team.home_record || '0-0',
                    team.away_record || '0-0',
                    team.close_record || '0-0',
                    team.overtime_record || '0-0'
                ];
            default:
                return [
                    index + 1,
                    team.team_name,
                    team.wins,
                    team.losses,
                    team.win_percentage.toFixed(3),
                    team.points_for_per_game,
                    team.points_against_per_game,
                    team.point_differential,
                    team.streak
                ];
        }
    };

    const currentStandings = getCurrentStandings();
    const headers = getHeaders();

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-white">Loading standings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    if (standings.length === 0) {
        return (
            <div className="p-6">
                <div className="text-white">No standings data available.</div>
            </div>
        );
    }

    return (
        <div className="w-full text-white border-2 border-green-400 bg-[#1d1d1d] mr-3 rounded-2xl pb-5">
            {/* Tab Navigation */}
            <div className="w-full border-b-1 border-[#9f9f9f] min-h-10 flex justify-between">
                <button
                    className={`w-1/4 border-1 rounded-tl-2xl transition ${activeTab === 'league' ? 'bg-[#333]' : 'hover:bg-[#333]'
                        }`}
                    onClick={() => setActiveTab('league')}
                >
                    League
                </button>
                <button
                    className={`w-1/4 border-1 transition ${activeTab === 'conference' ? 'bg-[#333]' : 'hover:bg-[#333]'
                        }`}
                    onClick={() => setActiveTab('conference')}
                >
                    Conference
                </button>
                <button
                    className={`w-1/4 border-1 transition ${activeTab === 'division' ? 'bg-[#333]' : 'hover:bg-[#333]'
                        }`}
                    onClick={() => setActiveTab('division')}
                >
                    Division
                </button>
                <button
                    className={`w-1/4 border-1 rounded-tr-2xl transition ${activeTab === 'situational' ? 'bg-[#333]' : 'hover:bg-[#333]'
                        }`}
                    onClick={() => setActiveTab('situational')}
                >
                    Situational
                </button>
            </div>

            <div className="overflow-x-auto mx-auto">
                {/* Header */}
                <div className={`grid text-[#9f9f9f] font-semibold text-xs px-2 py-1 mb-3 pt-5 ${activeTab === 'situational'
                        ? 'grid-cols-[25px_1fr_repeat(7,0.4fr)]'
                        : 'grid-cols-[25px_1fr_repeat(7,0.4fr)]'
                    }`}>
                    {headers.map((header, index) => (
                        <p key={index} className={index === 1 ? 'text-left' : ''}>
                            {header}
                        </p>
                    ))}
                </div>

                {/* Rows */}
                {currentStandings.map((team, index) => {
                    const rowData = getRowData(team, index);
                    return (
                        <div
                            key={team.team_name}
                            className={`grid text-sm px-2 py-1 hover:bg-[#333] transition ${activeTab === 'situational'
                                    ? 'grid-cols-[25px_1fr_repeat(7,0.4fr)]'
                                    : 'grid-cols-[25px_1fr_repeat(7,0.4fr)]'
                                }`}
                        >
                            {rowData.map((data, dataIndex) => (
                                dataIndex === 1 ? (
                                    <div key={dataIndex} className="flex flex-row items-center">
                                        <img
                                            src={getTeamLogoUrlFromName(team.team_short)}
                                            alt={team.id.toString()}
                                            className="w-5 h-5 mr-3"
                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                        />
                                        <p className="text-left">{data}</p>
                                    </div>
                                ) : (
                                    <p key={dataIndex}>{data}</p>
                                )
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}