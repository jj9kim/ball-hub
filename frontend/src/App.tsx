import PlayerStats from "./components/PlayerStats";

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">
        🏀 Basketball Stats
      </h1>
      <p className="mt-4 text-gray-700">
        New frontend initialized successfully!
        <PlayerStats/>
      </p>
    </div>
  )
}