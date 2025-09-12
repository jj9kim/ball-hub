import logo from "../img/BallHub.png";
import settings from "../img/settings.svg"

function Header() {
    return (
        <div className="h-1/10 mt-0 bg-[#1a1a1a] flex justify-between">
            <div className="flex pl-15 bg-[#1a1a1a] pt-1">
                <img src={logo} className="h-20 w-20 right-30 hover:rotate-7" alt="logo" />
                <h2 className="pt-4 font-bold text-white text-5xl hover:text-[#9f9f9f]">BallHub</h2>
            </div>
            <div className="pt-5 max-xl:hidden xl:block xl:pr-70">
                <form className="max-w-md mx-auto">
                    <label form="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">Search</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input type="search" id="default-search" autoComplete="off" className="focus:outline-none block w-75 p-3 ps-10 text-sm text-white rounded-3xl bg-[#2c2c2c]" placeholder="Search" />
                    </div>
                </form>
            </div>
            <div className="flex flex-row pr-5">
                <div className="pt-6 max-lg:hidden lg:block">
                    <button className="text-white font-bold text-2xl hover:text-[#9f9f9f]">Teams</button>
                </div>
                <div className="pl-7 pt-6 max-lg:hidden lg:block">
                    <button className="text-white font-bold text-2xl hover:text-[#9f9f9f]">Player Stats</button>
                </div>
                <div className="pl-7 pt-3">
                    <p className="text-white text-5xl">|</p>
                </div>
                <div className="pl-7 pt-6">
                    <img src={settings} alt="settings" className="h-8 w-8 hover:rotate-7" />
                </div>
            </div>
        </div>
    )
}

export default Header
