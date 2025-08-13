import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Games() {
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);

    useEffect(() => {
        axios.get('/api/games')
            .then(res => setGames(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Select Game</h2>
            <select
                className="w-full p-2 border rounded"
                onChange={(e) => setSelectedGame(e.target.value)}
            >
                <option value="">-- Select a game --</option>
                {games.map(game => (
                    <option key={game.id} value={game.id}>
                        {game.matchup} ({game.date})
                    </option>
                ))}
            </select>

            {selectedGame && <GameStats gameId={selectedGame} />}
        </div>
    );
}