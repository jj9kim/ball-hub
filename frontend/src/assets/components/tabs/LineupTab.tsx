
export default function LineupTab() {
    return (
        <div className="min-h-[100vh] rounded-2xl">
            <div className='bg-[#343434] h-15 rounded-t-2xl'></div>
            <div className='bg-[#2c2c2c] h-1'></div>
            <div className='bg-[#343434] h-15'></div>
            <div className="relative w-full mx-auto aspect-[3/2] bg-[#2c2c2c] overflow-hidden shadow-2xl">
                {/* Court Base */}
                <div className="absolute inset-0 bg-[#2c2c2c]"></div>

                {/* Half-Court Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#343434] transform -translate-x-1/2"></div>

                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 w-28 h-28 border-4 border-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#343434] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                {/* Left Key/Paint Area */}
                <div className="absolute top-1/2 w-60 h-50 border-4 border-[#343434] transform -translate-y-1/2 border-l-0"></div>

                {/* Right Key/Paint Area */}
                <div className="absolute top-1/2 right-0 w-60 h-50 border-4 border-[#343434] transform -translate-y-1/2 border-r-0"></div>

                {/* Left Free Throw Circle */}
                <div className="absolute top-1/2 left-41 w-36 h-36 border-4 border-[#343434] rounded-full transform -translate-y-1/2"></div>

                {/* Right Free Throw Circle */}
                <div className="absolute top-1/2 right-41 w-36 h-36 border-4 border-[#343434] rounded-full transform -translate-y-1/2"></div>

                {/* Left Three-Point Line */}
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                    <div className="relative">
                        {/* Curved section */}
                        <div className="pt-10 pb-10">
                            <div className="w-90 h-130 border-4 border-l-0 border-[#343434] rounded-r-full"></div>
                        </div>
                    </div>
                </div>

                {/* Right Three-Point Line */}
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                    <div className="relative">
                        {/* Curved section */}
                        <div className="pt-10 pb-10">
                            <div className="w-90 h-130 border-4 border-r-0 border-[#343434] rounded-l-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}