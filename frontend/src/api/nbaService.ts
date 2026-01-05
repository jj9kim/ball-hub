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
  game_date: string;
  game_id: string;
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

const API_BASE_URL = 'http://127.0.0.1:5000';

export class NBAService {
  static async fetchGames(): Promise<NBAAPIResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/nba-games`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NBAAPIResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch NBA games');
      }

      return data;
    } catch (error) {
      console.error('Error fetching NBA games:', error);
      throw error;
    }
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  static getWinner(game: NBAGame): NBATeamStats | null {
    if (game.teams.length !== 2) return null;

    const team1 = game.teams[0];
    const team2 = game.teams[1];

    return team1.pts > team2.pts ? team1 : team2;
  }
}