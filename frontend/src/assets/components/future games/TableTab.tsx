import React from 'react';
import type { FullScheduleGame } from '../../../api/nbaService';

interface TableTabProps {
    futureGame: FullScheduleGame;
}

export default function TableTab({ futureGame }: TableTabProps) {
    return (
        <div className="p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Season Stats Comparison</h3>
            <div className="flex justify-around">
                <div className="text-center">
                    <p className="text-gray-400 text-sm">{futureGame.homeTeam_teamName}</p>
                    <p className="text-white font-bold text-xl">{futureGame.homeTeam_wins} - {futureGame.homeTeam_losses}</p>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm">{futureGame.awayTeam_teamName}</p>
                    <p className="text-white font-bold text-xl">{futureGame.awayTeam_wins} - {futureGame.awayTeam_losses}</p>
                </div>
            </div>
        </div>
    );
}