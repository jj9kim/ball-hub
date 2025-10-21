

export default function TeamStatsTab() {
  return (
    <div>
      <div className="w-full text-white border-2 border-green-400 bg-[#1d1d1d] rounded-2xl">
        <button className="ml-5 border-1 border-white rounded-2xl pl-3 pr-3 pt-1 pb-1 mt-3 mb-3">Players</button>
        <button className="ml-5 border-1 border-white rounded-2xl pl-3 pr-3 pt-1 pb-1 mt-3 mb-3">Teams</button>
      </div>
      <div className="border-1 border-red-500 mt-3 min-h-10 w-full rounded-2xl bg-[#1d1d1d]"></div>
    </div>
  )
}
