import { useEffect, useState } from "react";

interface Standings {
    id: number,
    team_name: string,
    team_short: string,
    conference: string,
    division: string,
    wins: number,
    losses: number,
    win_percentage: number,
    points_for_per_game: number,
    points_against_per_game: number,
    point_differential: number,
    home_record: string,
    away_record: string,
    conference_record: string,
    division_record: string,
    last_ten_record: string,
    streak: string
}

export default function TableTab() {
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

    // Add loading and error states
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

    console.log(standings[0].team_name); // Now this is safe

    return (
        <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">NBA Standings</h3>
            <div className="text-white">
                First team: {standings[0].team_name}
            </div>
        </div>
    );
}