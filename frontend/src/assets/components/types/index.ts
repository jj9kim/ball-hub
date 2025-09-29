export interface Stats {
    player_id: number;
    player_name: string;
    player_name_short: string;
    position: string;
    position_sort: number;
    game_id: number;
    team_id: number;
    minutes: number;
    points: number;
    fg_made: number;
    fg_attempted: number;
    fg_percentage: number;
    three_pt_made: number;
    three_pt_attempted: number;
    three_pt_percentage: number;
    ft_made: number;
    ft_attempted: number;
    ft_percentage: number;
    offensive_rebounds: number;
    defensive_rebounds: number;
    total_rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    personal_fouls: number;
    technical_fouls: number;
    ejected: number;
    ortg: number;
    usg: number;
    url: string;
    player_rating: number;
}

export interface UnderlineStyle {
    width: number;
    left: number;
}

export type TabType = 'facts' | 'lineup' | 'table' | 'stats';

export interface Player {
    id: number;
    name: string;
    number: string;
    position: string;
    x: number;
    y: number;
    team: 'home' | 'away';
    photoUrl?: string;
    stats?: Partial<Stats>;
}

export interface GamePageProps {
    date?: string;
    id: string;
    teamsThisGame: any[];
    teamStats: Stats[];
}


export interface PlayerCardProps {
    player: Player | null;
    onClose: () => void;
}