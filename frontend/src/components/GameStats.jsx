export default function GameStats({ gameId }) {
    const [stats, setStats] = useState([]);
  
    useEffect(() => {
      axios.get(`/api/games/${gameId}/stats`)
        .then(res => setStats(res.data))
    }, [gameId]);
  
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Player Stats</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Player</th>
                <th className="py-2 px-4 border">Points</th>
                <th className="py-2 px-4 border">Rebounds</th>
                <th className="py-2 px-4 border">Assists</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => (
                <tr key={stat.player_id}>
                  <td className="py-2 px-4 border">{stat.player_name}</td>
                  <td className="py-2 px-4 border">{stat.points}</td>
                  <td className="py-2 px-4 border">{stat.rebounds}</td>
                  <td className="py-2 px-4 border">{stat.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }