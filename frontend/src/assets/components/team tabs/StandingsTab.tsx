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

export default function StandingsTab() {
    const [standings, setStandings] = useState<Standings[]>([]);
    const [advancedStandings, setAdvancedStandings] = useState<AdvancedStandings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // Safe logging - only if standings has data
    if (standings.length > 3) {
        const teamName = standings[3].team_name;
        const lastNamePart = teamName?.split(" ")[1]; // Optional chaining
        console.log(lastNamePart);
    }

    // Safe sorting with error handling
    const nba_standings = standings
        .filter(team => team && typeof team.win_percentage === 'number')
        .sort((a, b) => {
            try {
                const diff = b.win_percentage - a.win_percentage;
                if (diff !== 0) return diff;

                // Safe conference record parsing
                const aConferenceRecord = a.conference_record || "0-0";
                const bConferenceRecord = b.conference_record || "0-0";

                const aConfWins = Number(aConferenceRecord.split("-")[0]) || 0;
                const bConfWins = Number(bConferenceRecord.split("-")[0]) || 0;

                return bConfWins - aConfWins;
            } catch (error) {
                console.error('Error sorting standings:', error);
                return 0; // Fallback: maintain original order
            }
        });

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
            <div className="w-full border-b-1 border-[#9f9f9f] min-h-10 flex justify-between">
                <button className="hover:bg-[#333] w-1/4 border-1 rounded-tl-2xl">League</button>
                <button className="hover:bg-[#333] w-1/4 border-1">Conference</button>
                <button className="hover:bg-[#333] w-1/4 border-1">Division</button>
                <button className="hover:bg-[#333] w-1/4 border-1 rounded-tr-2xl">Situational</button>
            </div>
            <div className="overflow-x-auto mx-auto">
                {/* Header */}
                <div className="grid grid-cols-[25px_1fr_repeat(7,0.4fr)] text-[#9f9f9f] font-semibold text-xs px-2 py-1 mb-3 pt-5">
                    <p>#</p>
                    <p className="text-left">Team</p>
                    <p>W</p>
                    <p>L</p>
                    <p>Win%</p>
                    <p>PF/G</p>
                    <p>PA/G</p>
                    <p>Diff</p>
                    <p>Streak</p>
                </div>

                {/* Rows */}
                {nba_standings.map((team, index) => (
                    <div
                        key={team.team_name}
                        className={`grid grid-cols-[25px_1fr_repeat(7,0.4fr)] text-sm px-2 py-1 hover:bg-[#333] transition`}

                    >
                        <p>{index + 1}</p>
                        <div className="flex flex-row items-center">
                            <img
                                src={getTeamLogoUrlFromName(team.team_short)}
                                alt={team.id.toString()}
                                className="w-5 h-5 mr-3"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                            <p className="text-left">{team.team_name}</p>
                        </div>
                        <p>{team.wins}</p>
                        <p>{team.losses}</p>
                        <p>{team.win_percentage.toFixed(3)}</p>
                        <p>{team.points_for_per_game}</p>
                        <p>{team.points_against_per_game}</p>
                        <p>{team.point_differential}</p>
                        <p>{team.streak}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}


