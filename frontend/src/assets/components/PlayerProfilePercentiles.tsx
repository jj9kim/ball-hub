// assets/components/playerprofile/PlayerPercentileStats.tsx
import React from 'react';

interface PlayerPercentileStatsProps {
    allRankingStats: any;
    allStatsLoading: boolean;
}

interface StatConfig {
    key: string;
    label: string;
    formatValue: (value: any) => string;
    higherIsBetter: boolean;
    dataSource: 'scoring' | 'playmaking' | 'rebounding' | 'defense';
    category: 'basic' | 'hustle' | 'estimated' | 'advanced';
}

const PlayerPercentileStats: React.FC<PlayerPercentileStatsProps> = ({ allRankingStats, allStatsLoading }) => {
    // Define ALL stats with their configurations - reordered by priority
    const allStatsConfig: StatConfig[] = [
        // === SCORING (Highest Priority) ===
        { key: 'PTS', label: 'PTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'scoring', category: 'basic' },
        { key: 'FG3_PCT', label: '3P%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'scoring', category: 'basic' },
        { key: 'E_OFF_RATING', label: 'OFF RTG', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'scoring', category: 'estimated' },
        { key: 'E_PACE', label: 'PACE', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'scoring', category: 'estimated' },
        { key: 'PFD', label: 'PFD', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'scoring', category: 'basic' },
        { key: 'DD2', label: 'DD', formatValue: (v) => v.toString(), higherIsBetter: true, dataSource: 'scoring', category: 'basic' },
        { key: 'E_USG_PCT', label: 'USG%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'scoring', category: 'estimated' },
        { key: 'FG_PCT', label: 'FG%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'scoring', category: 'basic' },
        { key: 'FT_PCT', label: 'FT%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'scoring', category: 'basic' },
        { key: 'E_NET_RATING', label: 'NET RTG', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'scoring', category: 'estimated'},
        { key: 'PLUS_MINUS', label: '+/-', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'scoring', category: 'basic'},
        { key: 'BLKA', label: 'BLKA', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'scoring', category: 'basic'},
        { key: 'TD3', label: 'TD', formatValue: (v) => v.toString(), higherIsBetter: true, dataSource: 'scoring', category: 'basic'},

        // === PLAYMAKING ===
        { key: 'AST', label: 'AST', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'playmaking', category: 'basic'},
        { key: 'E_AST_RATIO', label: 'AST RAT', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'playmaking', category: 'estimated'},
        { key: 'SCREEN_ASSISTS', label: 'SCRN AST', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'playmaking', category: 'hustle' },
        { key: 'TOV', label: 'TOV', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'playmaking', category: 'basic'},
        { key: 'E_TOV_PCT', label: 'TOV%', formatValue: (v) => (v).toFixed(1) + '%', higherIsBetter: false, dataSource: 'playmaking', category: 'estimated' },
        { key: 'SCREEN_AST_PTS', label: 'SCR PTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'playmaking', category: 'hustle'},

        // === REBOUNDING ===
        { key: 'REB', label: 'REB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'rebounding', category: 'basic'},
        { key: 'DREB', label: 'DREB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'rebounding', category: 'basic' },
        { key: 'OREB', label: 'OREB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'rebounding', category: 'basic' },
        { key: 'BOX_OUTS', label: 'BOXOUTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'rebounding', category: 'hustle' },
        { key: 'E_REB_PCT', label: 'REB%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'rebounding', category: 'estimated' },
        { key: 'E_DREB_PCT', label: 'DREB%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'rebounding', category: 'estimated'},
        { key: 'E_OREB_PCT', label: 'OREB%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'rebounding', category: 'estimated' },
        

        // === DEFENSE ===
        { key: 'STL', label: 'STL', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'defense', category: 'basic'},
        { key: 'E_DEF_RATING', label: 'DEF RTG', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'defense', category: 'estimated' },
        { key: 'DEFLECTIONS', label: 'DEFL', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'defense', category: 'hustle' },
        { key: 'OFF_LOOSE_BALLS_RECOVERED', label: 'OFF LBR', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'defense', category: 'hustle' },
        { key: 'CHARGES_DRAWN', label: 'CHRG', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'defense', category: 'hustle' },
        { key: 'BLK', label: 'BLK', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'defense', category: 'basic' },
        { key: 'PF', label: 'PF', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'defense', category: 'basic' },
        { key: 'CONTESTED_SHOTS', label: 'CONTEST', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'defense', category: 'hustle' },
        { key: 'DEF_LOOSE_BALLS_RECOVERED', label: 'DEF LBR', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'defense', category: 'hustle'},
    ];

    const getBarColor = (higherIsBetter: boolean): string => {
        return higherIsBetter
            ? 'bg-gradient-to-r from-blue-500 to-purple-500'
            : 'bg-gradient-to-r from-red-500 to-orange-500';
    };

    const getStatData = (config: StatConfig): { value: any; percentile: number } | null => {
        let backendDataSource;
        let backendPercentileSource;

        switch (config.category) {
            case 'basic':
                backendDataSource = allRankingStats.basic_stats;
                backendPercentileSource = allRankingStats.percentiles?.basic;
                break;
            case 'hustle':
                backendDataSource = allRankingStats.hustle_stats;
                backendPercentileSource = allRankingStats.percentiles?.hustle;
                break;
            case 'estimated':
                backendDataSource = allRankingStats.estimated_metrics;
                backendPercentileSource = allRankingStats.percentiles?.estimated;
                break;
            case 'advanced':
                backendDataSource = allRankingStats.advanced_stats;
                backendPercentileSource = allRankingStats.percentiles?.advanced;
                break;
            default:
                return null;
        }

        if (!backendDataSource || !backendPercentileSource) return null;

        const value = backendDataSource[config.key];
        const percentile = backendPercentileSource[config.key];

        if (value === undefined || percentile === undefined) return null;

        return { value, percentile };
    };

    if (allStatsLoading) {
        return (
            <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-400 text-sm">Loading...</p>
            </div>
        );
    }

    if (!allRankingStats?.basic_stats) {
        return (
            <div className="p-4 text-center text-gray-500">
                <p className="text-white text-sm mb-1">No ranking data</p>
                <p className="text-gray-400 text-xs">2025-26 season</p>
            </div>
        );
    }

    // Filter and sort stats by priority
    const scoringStats = allStatsConfig.filter(s => s.dataSource === 'scoring');
    const playmakingStats = allStatsConfig.filter(s => s.dataSource === 'playmaking');
    const reboundingStats = allStatsConfig.filter(s => s.dataSource === 'rebounding');
    const defenseStats = allStatsConfig.filter(s => s.dataSource === 'defense');

    const renderStatSection = (title: string, stats: StatConfig[], color: string) => {
        if (stats.length === 0) return null;

        // Split into two columns for better layout
        const half = Math.ceil(stats.length / 2);
        const leftColumn = stats.slice(0, half);
        const rightColumn = stats.slice(half);

        return (
            <div className="mb-3">
                <h3 className="text-white font-semibold mb-1.5 text-[11px] border-b border-gray-800 pb-1 flex items-center">
                    <div className={`w-2 h-2 rounded-full ${color} mr-2`}></div>
                    {title}
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {/* Left Column */}
                    <div className="space-y-1">
                        {leftColumn.map((config) => {
                            const data = getStatData(config);
                            if (!data) return null;

                            const percentileWidth = data.percentile;
                            const barColor = getBarColor(config.higherIsBetter);

                            return (
                                <div
                                    key={`${config.dataSource}-${config.key}`}
                                    className="flex items-center justify-between space-x-1 py-1 px-1.5 hover:bg-gray-800/40 rounded transition-colors"
                                >
                                    {/* Stat Label */}
                                    <div className="w-14">
                                        <span className="text-white text-[10px] font-medium whitespace-nowrap">
                                            {config.label}
                                        </span>
                                    </div>

                                    {/* Stat Value */}
                                    <div className="w-10 text-right">
                                        <span className="text-white text-[10px] font-bold">
                                            {config.formatValue(data.value)}
                                        </span>
                                    </div>

                                    {/* Percentile Bar */}
                                    <div className="flex-1 flex items-center space-x-1">
                                        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden min-w-[20px]">
                                            <div
                                                className={`h-full ${barColor}`}
                                                style={{ width: `${percentileWidth}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[9px] text-gray-400 whitespace-nowrap w-6 text-right">
                                            {Math.round(percentileWidth)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-1">
                        {rightColumn.map((config) => {
                            const data = getStatData(config);
                            if (!data) return null;

                            const percentileWidth = data.percentile;
                            const barColor = getBarColor(config.higherIsBetter);

                            return (
                                <div
                                    key={`${config.dataSource}-${config.key}`}
                                    className="flex items-center justify-between space-x-1 py-1 px-1.5 hover:bg-gray-800/40 rounded transition-colors"
                                >
                                    {/* Stat Label */}
                                    <div className="w-14">
                                        <span className="text-white text-[10px] font-medium whitespace-nowrap">
                                            {config.label}
                                        </span>
                                    </div>

                                    {/* Stat Value */}
                                    <div className="w-10 text-right">
                                        <span className="text-white text-[10px] font-bold">
                                            {config.formatValue(data.value)}
                                        </span>
                                    </div>

                                    {/* Percentile Bar */}
                                    <div className="flex-1 flex items-center space-x-1">
                                        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden min-w-[20px]">
                                            <div
                                                className={`h-full ${barColor}`}
                                                style={{ width: `${percentileWidth}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[9px] text-gray-400 whitespace-nowrap w-6 text-right">
                                            {Math.round(percentileWidth)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-2 bg-gray-900/20 rounded-lg">
            {renderStatSection("SCORING", scoringStats, "bg-gradient-to-r from-purple-500 to-pink-500")}
            {renderStatSection("PLAYMAKING", playmakingStats, "bg-gradient-to-r from-blue-500 to-cyan-500")}
            {renderStatSection("REBOUNDING", reboundingStats, "bg-gradient-to-r from-green-500 to-emerald-500")}
            {renderStatSection("DEFENSE", defenseStats, "bg-gradient-to-r from-red-500 to-orange-500")}
        </div>
    );
};

export default PlayerPercentileStats;