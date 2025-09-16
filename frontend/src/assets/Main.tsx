import React from "react";
import { useState } from "react"
import Popup from "./Popup";


function Main() {
    const [caretUp, setCaretUp] = useState(false);
    return (
        <React.Fragment>
            {
                caretUp ? <div className="flex flex-col justify-center">
                    <div className="border-4 border-white text-white flex justify-center w-screen">
                        <div className="border-4 border-red-500 w-1/2 flex justify-center">
                            <button className="hover:text-[#9f9f9f] flex flex-row justify-center w-30" onClick={() => setCaretUp(false)}>Today&nbsp;
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="pt-1">
                                    <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <Popup trigger={true}>
                        <h1>hello</h1>
                    </Popup>
                </div>
                    : <div className="w-screen border-4 border-white text-white flex justify-center">
                        <div className="border-4 border-red-500 w-1/2 flex justify-center">
                            <button className="hover:text-[#9f9f9f] flex flex-row justify-center w-30" onClick={() => setCaretUp(true)}>Today&nbsp;
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="pt-1">
                                    <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
            }
        </React.Fragment>
    )
}

export default Main
