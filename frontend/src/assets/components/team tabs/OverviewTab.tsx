import type { Standings } from "../types";
import { useState, useEffect } from "react";
import { getTeamLogoUrlFromName } from "../../../utils/teamMappings";

export default function OverviewTab() {
    const [standings, setStandings] = useState<Standings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:8081/basic_standings')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then((data: Standings[]) => {
                setStandings(data);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-white">Loading standings...</div>
            </div>
        );
    } else if (error) {
        return (
            <div className="p-6">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    } else if (standings.length === 0) {
        return (
            <div className="p-6">
                <div className="text-white">No standings data available.</div>
            </div>
        );
    }

    console.log(standings[3].team_name.split(" ")[1]); // Now this is safe

    let nba_standings = standings.sort((a, b) => {
        const diff = b.win_percentage - a.win_percentage;
        if (diff !== 0) return diff;

        const aConfWins = Number(a.conference_record.split("-")[0]);
        const bConfWins = Number(b.conference_record.split("-")[0]);
        return bConfWins - aConfWins;
    });

    return (
        <div className="flex flex-row">
            <div className="w-3/4 text-white border-2 border-green-400 bg-[#1d1d1d] mr-3 rounded-2xl">
                <div className="overflow-x-auto max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="grid grid-cols-[25px_1fr_repeat(7,0.4fr)] text-[#9f9f9f] font-semibold text-xs px-2 py-1 mb-3">
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
            <div className="w-1/4 border-2 border-red-500 min-h-10 bg-[#1d1d1d] rounded-2xl"></div>
        </div>
    );
}

