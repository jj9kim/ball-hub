import logo from "../img/BallHub.png";

function Header() {
  return (
      <div className="h-1/10 w-full mt-0 bg-[#1a1a1a] flex">
        <div className="flex pl-15">
            <img src={logo} className="h-20 w-20 right-30" alt="logo" />
              <h2 className="pt-3.5 font-bold text-white text-5xl">BallHub</h2>
        </div>
        <div className="pl-20 pt-4">
            <form className="max-w-md mx-auto">
                  <label form="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">Search</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none">
                              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                          </svg>
                      </div>
                      <input type="search" id="default-search" autoComplete="off" className="focus:outline-none block w-75 p-3 ps-10 text-sm text-white rounded-2xl bg-[#2c2c2c]" placeholder="Search" required />
                  </div>
              </form>
        </div>
        <div className="pl-70 pt-5">
            <button className="text-white font-bold text-3xl">Table</button>
        </div>
    </div>
  )
}

export default Header
