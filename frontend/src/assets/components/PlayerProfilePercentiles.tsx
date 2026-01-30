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
    dataSource: 'basic_stats' | 'hustle_stats' | 'estimated_metrics';
}

const PlayerPercentileStats: React.FC<PlayerPercentileStatsProps> = ({ allRankingStats, allStatsLoading }) => {
    // Define ALL stats with their configurations
    const allStatsConfig: StatConfig[] = [
        // === BASIC STATS ===
        { key: 'PTS', label: 'PTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'REB', label: 'REB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'AST', label: 'AST', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'STL', label: 'STL', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'BLK', label: 'BLK', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FGM', label: 'FGM', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FGA', label: 'FGA', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FG_PCT', label: 'FG%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FG3M', label: '3PM', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FG3A', label: '3PA', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FG3_PCT', label: '3P%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FTM', label: 'FTM', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FTA', label: 'FTA', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'FT_PCT', label: 'FT%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'OREB', label: 'OREB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'DREB', label: 'DREB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'TOV', label: 'TOV', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'basic_stats' },
        { key: 'BLKA', label: 'BLKA', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'basic_stats' },
        { key: 'PF', label: 'PF', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'basic_stats' },
        { key: 'PFD', label: 'PFD', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'PLUS_MINUS', label: '+/-', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'MIN', label: 'MIN', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'GP', label: 'GP', formatValue: (v) => v.toString(), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'GS', label: 'GS', formatValue: (v) => v.toString(), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'W', label: 'W', formatValue: (v) => v.toString(), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'L', label: 'L', formatValue: (v) => v.toString(), higherIsBetter: false, dataSource: 'basic_stats' },
        { key: 'W_PCT', label: 'W%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'NBA_FANTASY_PTS', label: 'FPTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'DD2', label: 'DD', formatValue: (v) => v.toString(), higherIsBetter: true, dataSource: 'basic_stats' },
        { key: 'TD3', label: 'TD', formatValue: (v) => v.toString(), higherIsBetter: true, dataSource: 'basic_stats' },

        // === HUSTLE STATS ===
        { key: 'DEFLECTIONS', label: 'DEFL', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'CHARGES_DRAWN', label: 'CHRG', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'SCREEN_ASSISTS', label: 'SCRN', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'SCREEN_AST_PTS', label: 'SCR PTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'OFF_LOOSE_BALLS_RECOVERED', label: 'OFF LBR', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'DEF_LOOSE_BALLS_RECOVERED', label: 'DEF LBR', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'LOOSE_BALLS_RECOVERED', label: 'LBR', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'OFF_BOXOUTS', label: 'OFF BOX', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'DEF_BOXOUTS', label: 'DEF BOX', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'BOX_OUT_PLAYER_TEAM_REBS', label: 'TEAM REB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'BOX_OUT_PLAYER_REBS', label: 'PLAYER REB', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'BOX_OUTS', label: 'BOXOUTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'CONTESTED_SHOTS', label: 'CONTS', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'CONTESTED_SHOTS_2PT', label: 'CONT2', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },
        { key: 'CONTESTED_SHOTS_3PT', label: 'CONT3', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'hustle_stats' },

        // === ADVANCED METRICS ===
        // FIXED: Defensive Rating - lower is better
        { key: 'E_OFF_RATING', label: 'OFF RTG', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'estimated_metrics' },
        { key: 'E_DEF_RATING', label: 'DEF RTG', formatValue: (v) => v.toFixed(1), higherIsBetter: false, dataSource: 'estimated_metrics' }, // FIXED: lower is better
        { key: 'E_NET_RATING', label: 'NET RTG', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'estimated_metrics' },
        { key: 'E_PACE', label: 'PACE', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'estimated_metrics' },
        // FIXED: Multiply percentages by 100
        { key: 'E_USG_PCT', label: 'USG%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'estimated_metrics' },
        { key: 'E_AST_RATIO', label: 'AST RAT', formatValue: (v) => v.toFixed(1), higherIsBetter: true, dataSource: 'estimated_metrics' },
        // FIXED: Multiply percentages by 100
        { key: 'E_OREB_PCT', label: 'OREB%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'estimated_metrics' },
        // FIXED: Multiply percentages by 100
        { key: 'E_DREB_PCT', label: 'DREB%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'estimated_metrics' },
        // FIXED: Multiply percentages by 100
        { key: 'E_REB_PCT', label: 'REB%', formatValue: (v) => (v * 100).toFixed(1) + '%', higherIsBetter: true, dataSource: 'estimated_metrics' },
        // FIXED: Multiply by 100 AND lower is better
        { key: 'E_TOV_PCT', label: 'TOV%', formatValue: (v) => (v).toFixed(1) + '%', higherIsBetter: false, dataSource: 'estimated_metrics' },
    ];

    const getBarColor = (higherIsBetter: boolean): string => {
        return higherIsBetter
            ? 'bg-gradient-to-r from-blue-500 to-purple-500'
            : 'bg-gradient-to-r from-red-500 to-orange-500';
    };

    const getStatData = (config: StatConfig): { value: any; percentile: number } | null => {
        const dataSource = allRankingStats[config.dataSource];
        const percentileSource = allRankingStats.percentiles[config.dataSource === 'basic_stats' ? 'basic' :
            config.dataSource === 'hustle_stats' ? 'hustle' : 'estimated'];

        if (!dataSource || !percentileSource) return null;

        const value = dataSource[config.key];
        const percentile = percentileSource[config.key];

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

    // Group stats by data source
    const basicStats = allStatsConfig.filter(s => s.dataSource === 'basic_stats');
    const hustleStats = allStatsConfig.filter(s => s.dataSource === 'hustle_stats');
    const advancedStats = allStatsConfig.filter(s => s.dataSource === 'estimated_metrics');

    const renderStatSection = (title: string, stats: StatConfig[], hasData: boolean) => {
        if (!hasData) return null;

        const filteredStats = stats.filter(config => getStatData(config) !== null);

        if (filteredStats.length === 0) return null;

        return (
            <div className="mb-1">
                <h3 className="text-white font-semibold mb-0.5 text-[10px] border-b border-gray-800 pb-0.5">
                    {title}
                </h3>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {filteredStats.map((config) => {
                        const data = getStatData(config);
                        if (!data) return null;

                        const percentileWidth = data.percentile;
                        const barColor = getBarColor(config.higherIsBetter);

                        return (
                            <div
                                key={`${config.dataSource}-${config.key}`}
                                className="flex items-center justify-between space-x-1 py-0.5 px-1 hover:bg-gray-800/30 rounded transition-colors"
                            >
                                {/* Stat Label - Leftmost */}
                                <div className="w-10">
                                    <span className="text-white text-[10px] font-medium whitespace-nowrap">
                                        {config.label}
                                    </span>
                                </div>

                                {/* Stat Value - Middle */}
                                <div className="w-8 text-right">
                                    <span className="text-white text-[10px] font-bold">
                                        {config.formatValue(data.value)}
                                    </span>
                                </div>

                                {/* Percentile Bar - Right side */}
                                <div className="flex-1 flex items-center space-x-1">
                                    <div className="flex-1 h-0.5 bg-gray-700 rounded-full overflow-hidden min-w-[20px]">
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
        );
    };

    return (
        <div className="p-1">
            {renderStatSection("BASIC", basicStats, !!allRankingStats.basic_stats)}
            {renderStatSection("HUSTLE", hustleStats, !!allRankingStats.hustle_stats)}
            {renderStatSection("ADVANCED", advancedStats, !!allRankingStats.estimated_metrics)}
        </div>
    );
};

export default PlayerPercentileStats;