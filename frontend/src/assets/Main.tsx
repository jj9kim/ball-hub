import React, { useEffect, useState } from "react";
import { getTeamLogoUrl } from '../utils/teamMappings';

interface MainProps {
    isCalendarOpen: boolean;
    onOpenCalendar: () => void;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

interface Game {
    game_id: number,
    game_date: string,
    scraped_timestamp: string,
    teams_found: number
}

interface Team {
    game_id: number,
    team_id: number,
    minutes: string,
    points: number,
    offensive_rebounds: number,
    defensive_rebounds: number,
    total_rebounds: number,
    assists: number,
    steals: number,
    blocks: number,
    turnovers: number,
    personal_fouls: number
}

function Main({ isCalendarOpen, onOpenCalendar, selectedDate, onDateSelect }: MainProps) {
    const [data, setData] = useState<Game[]>([]);
    const [team, setTeam] = useState<Team[]>([]);

    useEffect(() => {
        fetch('http://localhost:8081/game_info')
            .then(res => res.json())
            .then((data: Game[]) => setData(data))
            .catch(err => console.log(err));
        fetch('http://localhost:8081/team_stats')
            .then(res => res.json())
            .then((team: Team[]) => setTeam(team))
            .catch(err => console.log(err));
    }, [])

    console.log(team)

    // Function to get display text for the date
    const getDateDisplayText = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        if (compareDate.getTime() === today.getTime()) {
            return "Today";
        } else if (compareDate.getTime() === yesterday.getTime()) {
            return "Yesterday";
        } else if (compareDate.getTime() === tomorrow.getTime()) {
            return "Tomorrow";
        } else {
            const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

            const weekday = weekdays[date.getDay()];
            const month = months[date.getMonth()];
            const day = date.getDate();

            return `${weekday}, ${month} ${day}`;
        }
    };

    // Function to change the selected date by offset days
    const changeDate = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + offset);
        onDateSelect(newDate);
    };

    let SelectedGame = [];
    let SelectedGameNumber = 0

    for (let i = 0; i < data.length; ++i) {
        const dateString = data[i].game_date;
        const [year, month, day] = dateString.split('-').map(Number);
        let newDate = new Date(year, month - 1, day);
        console.log(newDate)
        if (newDate.toDateString() == selectedDate.toDateString()) {
            SelectedGame[SelectedGameNumber] = data[i].game_id
            SelectedGameNumber += 1
        }
    }

    console.log(SelectedGame)

    let SelectedTeam = [];
    let SelectedTeamNumber = 0;

    for (let i = 0; i < team.length; ++i) {
        for (let j = 0; j < SelectedGame.length; ++j) {
            if (team[i].game_id == SelectedGame[j]) {
                SelectedTeam[SelectedTeamNumber] = team[i].team_id
                SelectedTeamNumber += 1
            }
        }
    }

    return (
        <React.Fragment>
            {/* Date bar - always visible regardless of calendar state */}
            <div className="z-1000 w-screen border-4 border-white text-white flex justify-center bg-[#1a1a1a]">
                <div className="border-4 border-red-500 w-1/2 flex justify-between py-2">
                    <button
                        className="hover:text-[#9f9f9f] text-xl font-bold pl-2"
                        onClick={() => changeDate(-1)}
                    >
                        &lt;
                    </button>
                    <button
                        className="hover:text-[#9f9f9f] flex flex-row justify-center items-center w-60"
                        onClick={onOpenCalendar}
                    >
                        {getDateDisplayText(selectedDate)}&nbsp;
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className={`pt-0.5 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`}
                        >
                            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                        </svg>
                    </button>
                    <button
                        className="hover:text-[#9f9f9f] text-xl font-bold pr-2"
                        onClick={() => changeDate(1)}
                    >
                        &gt;
                    </button>
                </div>
            </div>
            <div className="p-4 w-screen border-white border-4 flex justify-center">
                <div className="w-1/2 flex flex-col space-y-2">
                    {SelectedGame.map((gameId) => {
                        const teamsForThisGame = team.filter(t => t.game_id === gameId);
                        return (
                            <button
                                key={gameId}
                                className="border-red-600 border-2 flex justify-between items-center h-10 hover:border-amber-400 px-4"
                            >
                                {teamsForThisGame.map((d, i) => (
                                    <div key={i} className="text-white flex-1 text-center">
                                        <img
                                            src={getTeamLogoUrl(d.team_id)}
                                            alt={d.team_id.toString()}
                                            className="w-8 h-8 mr-2"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ))}
                            </button>
                        );
                    })}
                </div>
            </div>
        </React.Fragment>
    );
}

export default Main;