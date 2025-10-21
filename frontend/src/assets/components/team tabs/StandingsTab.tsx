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
type SortField = 'wins' | 'losses' | 'win_percentage' | 'points_for_per_game' | 'points_against_per_game' | 'point_differential' | 'streak' | 'home_record' | 'away_record' | 'close_record' | 'overtime_record';
type SortDirection = 'asc' | 'desc';

export default function StandingsTab() {
    const [standings, setStandings] = useState<Standings[]>([]);
    const [advancedStandings, setAdvancedStandings] = useState<AdvancedStandings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('league');
    const [sortField, setSortField] = useState<SortField>('wins'); // Changed default to 'wins'
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

    // Handle sort click
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to desc for most fields, asc for losses and points_against
            setSortField(field);
            setSortDirection(field === 'losses' || field === 'points_against_per_game' ? 'asc' : 'desc');
        }
    };

    // Parse record string to wins (e.g., "10-5" -> 10)
    const parseRecordWins = (record: string): number => {
        if (!record) return 0;
        const parts = record.split('-');
        return parts.length > 0 ? parseInt(parts[0]) || 0 : 0;
    };

    // Sort function for basic standings
    // Sort function for basic standings
    const sortBasicStandings = (teams: any[]) => {
        return [...teams].sort((a, b) => {
            let aValue: any = 0;
            let bValue: any = 0;

            switch (sortField) {
                case 'wins':
                    aValue = a.wins || 0;
                    bValue = b.wins || 0;
                    break;
                case 'losses':
                    aValue = a.losses || 0;
                    bValue = b.losses || 0;
                    break;
                case 'win_percentage':
                    aValue = a.win_percentage || 0;
                    bValue = b.win_percentage || 0;
                    break;
                case 'points_for_per_game':
                    aValue = a.points_for_per_game || 0;
                    bValue = b.points_for_per_game || 0;
                    break;
                case 'points_against_per_game':
                    aValue = a.points_against_per_game || 0;
                    bValue = b.points_against_per_game || 0;
                    break;
                case 'point_differential':
                    aValue = a.point_differential || 0;
                    bValue = b.point_differential || 0;
                    break;
                case 'streak':
                    // Handle streak (could be string like "W3" or "L2")
                    const aStreak = a.streak || '';
                    const bStreak = b.streak || '';
                    aValue = aStreak.startsWith('W') ? parseInt(aStreak.substring(1)) || 0 :
                        aStreak.startsWith('L') ? -(parseInt(aStreak.substring(1)) || 0) : 0;
                    bValue = bStreak.startsWith('W') ? parseInt(bStreak.substring(1)) || 0 :
                        bStreak.startsWith('L') ? -(parseInt(bStreak.substring(1)) || 0) : 0;
                    break;
                default:
                    aValue = a.wins || 0;
                    bValue = b.wins || 0;
            }

            // For numeric comparisons
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                const primaryComparison = sortDirection === 'desc' ? bValue - aValue : aValue - bValue;

                // If primary comparison results in a tie, use division record as tiebreaker
                if (primaryComparison === 0) {
                    // Parse division records (format: "W-L")
                    const aDivisionRecord = a.division_record || "0-0";
                    const bDivisionRecord = b.division_record || "0-0";

                    const aDivisionWins = parseInt(aDivisionRecord.split('-')[0]) || 0;
                    const bDivisionWins = parseInt(bDivisionRecord.split('-')[0]) || 0;

                    // Higher division wins = better (descending order)
                    return bDivisionWins - aDivisionWins;
                }

                return primaryComparison;
            }

            // For string comparisons
            return sortDirection === 'desc'
                ? String(bValue).localeCompare(String(aValue))
                : String(aValue).localeCompare(String(bValue));
        });
    };

    // Sort function for situational standings
    const sortSituationalStandings = (teams: any[]) => {
        return [...teams].sort((a, b) => {
            let aValue: any = 0;
            let bValue: any = 0;

            switch (sortField) {
                case 'wins':
                    aValue = a.wins || 0;
                    bValue = b.wins || 0;
                    break;
                case 'losses':
                    aValue = a.losses || 0;
                    bValue = b.losses || 0;
                    break;
                case 'win_percentage':
                    aValue = a.win_percentage || 0;
                    bValue = b.win_percentage || 0;
                    break;
                case 'home_record':
                    aValue = parseRecordWins(a.home_record);
                    bValue = parseRecordWins(b.home_record);
                    break;
                case 'away_record':
                    aValue = parseRecordWins(a.away_record);
                    bValue = parseRecordWins(b.away_record);
                    break;
                case 'close_record':
                    aValue = parseRecordWins(a.close_record);
                    bValue = parseRecordWins(b.close_record);
                    break;
                case 'overtime_record':
                    aValue = parseRecordWins(a.overtime_record);
                    bValue = parseRecordWins(b.overtime_record);
                    break;
                default:
                    aValue = a.wins || 0;
                    bValue = b.wins || 0;
            }

            return sortDirection === 'desc' ? bValue - aValue : aValue - aValue;
        });
    };

    // LEAGUE VIEW - sorted by selected field
    const leagueStandings = sortBasicStandings(
        standings.filter(team => team && typeof team.win_percentage === 'number')
    );

    // CONFERENCE VIEW - group by conference and sort within each conference
    const conferenceStandings = () => {
        const eastern = sortBasicStandings(
            standings.filter(team => team.conference === 'Eastern Conference')
        );
        const western = sortBasicStandings(
            standings.filter(team => team.conference === 'Western Conference')
        );
        return { eastern, western };
    };

    // DIVISION VIEW - group by division and sort within each division
    const divisionStandings = () => {
        const divisions: { [key: string]: any[] } = {};

        standings.forEach(team => {
            if (team.division) {
                if (!divisions[team.division]) {
                    divisions[team.division] = [];
                }
                divisions[team.division].push(team);
            }
        });

        // Sort each division by selected field
        Object.keys(divisions).forEach(division => {
            divisions[division] = sortBasicStandings(divisions[division]);
        });

        return divisions;
    };

    // SITUATIONAL VIEW - use advanced standings data
    const situationalStandings = sortSituationalStandings(
        advancedStandings.filter(team => team && typeof team.win_percentage === 'number')
    );

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
        const baseHeaders = [
            { key: 'rank', label: '#', sortable: false },
            { key: 'team', label: 'Team', sortable: false },
            { key: 'wins', label: 'W', sortable: true },
            { key: 'losses', label: 'L', sortable: true },
            { key: 'win_percentage', label: 'Win%', sortable: true },
            { key: 'points_for_per_game', label: 'PF/G', sortable: true },
            { key: 'points_against_per_game', label: 'PA/G', sortable: true },
            { key: 'point_differential', label: 'Diff', sortable: true },
            { key: 'streak', label: 'Streak', sortable: true }
        ];

        switch (activeTab) {
            case 'situational':
                return [
                    { key: 'rank', label: '#', sortable: false },
                    { key: 'team', label: 'Team', sortable: false },
                    { key: 'wins', label: 'W', sortable: true },
                    { key: 'losses', label: 'L', sortable: true },
                    { key: 'win_percentage', label: 'Win%', sortable: true },
                    { key: 'home_record', label: 'Home', sortable: true },
                    { key: 'away_record', label: 'Away', sortable: true },
                    { key: 'close_record', label: 'Close', sortable: true },
                    { key: 'overtime_record', label: 'Overtime', sortable: true }
                ];
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

    // Reset sort when tab changes - changed default to 'wins'
    useEffect(() => {
        setSortField('wins');
        setSortDirection('desc');
    }, [activeTab]);

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
                    ? 'grid-cols-[25px_1fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr]'
                    : 'grid-cols-[25px_1fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr]'
                    }`}>
                    {headers.map((header, index) => (
                        header.sortable ? (
                            <button
                                key={header.key}
                                className={`flex items-center justify-center gap-1 transition hover:text-white ${sortField === header.key ? 'text-white' : ''
                                    } ${index === 1 ? 'justify-start' : ''}`}
                                onClick={() => handleSort(header.key as SortField)}
                            >
                                <span>{header.label}</span>
                                {sortField === header.key && (
                                    <span className="text-xs">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                                )}
                            </button>
                        ) : (
                            <div
                                key={header.key}
                                className={`${index === 1 ? 'text-left' : 'text-center'}`}
                            >
                                {header.label}
                            </div>
                        )
                    ))}
                </div>

                {/* Rows */}
                {currentStandings.map((team, index) => {
                    const rowData = getRowData(team, index);
                    return (
                        <div
                            key={team.team_name}
                            className={`grid text-sm px-2 py-1 hover:bg-[#333] transition ${activeTab === 'situational'
                                ? 'grid-cols-[25px_1fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr]'
                                : 'grid-cols-[25px_1fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr]'
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
                                    <p key={dataIndex} className="text-center">{data}</p>
                                )
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}