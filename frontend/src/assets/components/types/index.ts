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

export type TeamTabType = 'overview' | 'standings' | 'matches' | 'stats';

export interface Player {
    player_id: number;
    player_name: string;
    number: string;
    position: string;
    x: number;
    y: number;
    team_id: number,
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

export interface Standings {
    id: number,
    team_name: string,
    team_short: string,
    conference: string,
    division: string,
    wins: number,
    losses: number,
    win_percentage: number,
    points_for_per_game: number,
    points_against_per_game: number,
    point_differential: number,
    home_record: string,
    away_record: string,
    conference_record: string,
    division_record: string,
    last_ten_record: string,
    streak: string
}