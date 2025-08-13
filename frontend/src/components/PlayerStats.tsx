import { useEffect, useState } from 'react'
import axios from 'axios'

interface Player {
    nameLong: string
    position: string
    points: number
    fg_made: number
    fg_attempted: number
}

export default function PlayerStats() {
    const [players, setPlayers] = useState<Player[]>([])

    useEffect(() => {
        axios.get('/api/data')
            .then(res => setPlayers(res.data.data))
            .catch(err => console.error(err))
    }, [])

    return (
        <div className="flex flex-col mt-8 space-y-4" style={{ backgroundColor: "#1b1d1f"}}>
            {players.map(player => (
                <div key={player.nameLong} className="flex flex-col items-center p-4 rounded-lg">
                    <h3 className="font-bold text-white">{player.nameLong}</h3>
                    <h4 className="items-center text-white">{player.position}</h4>
                    <h4 className="text-gray-400">Position</h4>
                    <p className="text-white">Points: {player.points}</p>
                    <p className="text-white">FG: {player.fg_made}/{player.fg_attempted}</p>
                </div>
            ))}
        </div>
    )
}