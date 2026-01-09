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
    jersey: string;
    plus_minus: number;
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

// In your types/index.ts, add:
export interface NBATeamStats {
  team_id: number;
  team_abbreviation: string;
  team_name: string;
  wl: string;
  pts: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  plus_minus: number;
}

export interface NBAGame {
  game_id: string;
  game_date: string;
  matchup: string;
  season_id: string;
  teams: NBATeamStats[];
}

export interface NBAAPIResponse {
  success: boolean;
  games: NBAGame[];
  count: number;
  error?: string;
}

export interface Standings {
    team_id: number;
    team_name: string;
    team_city: string;
    team_conference: string;
    team_division: string;
    wins: number;
    losses: number;
    win_pct: number;
    conference_rank: number;
    division_rank: number;
    games_back: number;
    streak: string;
    record: string;
    home_record: string;
    away_record: string;
    last_10_record: string;
    points_per_game: number;
    opp_points_per_game: number;
    point_differential: number;
}