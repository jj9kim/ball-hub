export interface NBATeamStats {
  team_id: number;
  team_abbreviation: string;
  team_name: string;
  wl?: string;  // Made optional for future games
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
  game_status?: string;  // Added for future games
  game_time?: string;     // Added for future games
  arena?: string;         // Added for future games
}

export interface NBAAPIResponse {
  success: boolean;
  games: NBAGame[];
  count: number;
  error?: string;
}

export interface FutureGamesResponse {
  success: boolean;
  games: NBAGame[];
  count: number;
  days_checked: number;
  season_end?: string;
  error?: string;
}

// NEW: Full Schedule Interfaces
export interface FullScheduleGame {
  leagueId: string;
  seasonYear: string;
  gameDate: string;
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  gameSequence: number;
  gameDateEst: string;
  gameTimeEst: string;
  gameDateTimeEst: string;
  gameDateUTC: string;
  gameTimeUTC: string;
  gameDateTimeUTC: string;
  awayTeamTime: string;
  homeTeamTime: string;
  day: string;
  monthNum: number;
  weekNumber: number;
  weekName: string;
  ifNecessary: boolean;
  seriesGameNumber: number;
  gameLabel: string;
  gameSubLabel: string;
  seriesText: string;
  arenaName: string;
  arenaState: string;
  arenaCity: string;
  postponedStatus: string;
  branchLink: string;
  gameSubtype: string;
  isNeutral: boolean;
  homeTeam_teamId: number;
  homeTeam_teamName: string;
  homeTeam_teamCity: string;
  homeTeam_teamTricode: string;
  homeTeam_teamSlug: string;
  homeTeam_wins: number;
  homeTeam_losses: number;
  homeTeam_score: number;
  homeTeam_seed: number;
  awayTeam_teamId: number;
  awayTeam_teamName: string;
  awayTeam_teamCity: string;
  awayTeam_teamTricode: string;
  awayTeam_teamSlug: string;
  awayTeam_wins: number;
  awayTeam_losses: number;
  awayTeam_score: number;
  awayTeam_seed: number;
  is_home?: boolean; // For team-specific endpoint
}

export interface FullScheduleResponse {
  success: boolean;
  games: FullScheduleGame[];
  count: number;
  future_count: number;
  past_count: number;
  live_count?: number;
  fields: string[];
}

export interface TeamFullScheduleResponse {
  success: boolean;
  team_id: string;
  games: FullScheduleGame[];
  count: number;
  future_count: number;
  past_count: number;
  fields: string[];
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

  // Fetch future games
  static async fetchFutureGames(days: number = 180): Promise<FutureGamesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/future-games?days=${days}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch future games');
      }

      return data;
    } catch (error) {
      console.error('Error fetching future games:', error);
      throw error;
    }
  }

  // Fetch all games (past + future)
  static async fetchAllGames(): Promise<{ 
    games: NBAGame[], 
    pastCount: number, 
    futureCount: number,
    totalCount: number 
  }> {
    try {
      // Fetch past games and future games in parallel
      const [pastGamesResponse, futureGamesResponse] = await Promise.all([
        this.fetchGames(),
        this.fetchFutureGames(180)
      ]);
      
      const allGames = [
        ...pastGamesResponse.games,
        ...futureGamesResponse.games
      ];
      
      // Remove duplicates (just in case)
      const uniqueGames = Array.from(
        new Map(allGames.map(game => [game.game_id, game])).values()
      );
      
      return {
        games: uniqueGames,
        pastCount: pastGamesResponse.games.length,
        futureCount: futureGamesResponse.games.length,
        totalCount: uniqueGames.length
      };
    } catch (error) {
      console.error('Error fetching all games:', error);
      throw error;
    }
  }

  // NEW: Fetch full schedule with all fields
  static async fetchFullSchedule(): Promise<FullScheduleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/full-schedule`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch full schedule');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching full schedule:', error);
      throw error;
    }
  }

  // NEW: Fetch full schedule for a specific team
  static async fetchTeamFullSchedule(teamId: number): Promise<TeamFullScheduleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/team/${teamId}/full-schedule`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch team schedule');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching team schedule:', error);
      throw error;
    }
  }

  // NEW: Convert FullScheduleGame to NBAGame format for compatibility
  // Add this method to NBAService class
static convertToNBAGame(scheduleGame: FullScheduleGame): NBAGame | null {
  try {
    // Create team stats objects with all required fields
    const homeTeamStats: NBATeamStats = {
      team_id: scheduleGame.homeTeam_teamId,
      team_abbreviation: scheduleGame.homeTeam_teamTricode || scheduleGame.homeTeam_teamSlug || '???',
      team_name: scheduleGame.homeTeam_teamName || `${scheduleGame.homeTeam_teamCity} ${scheduleGame.homeTeam_teamName}`,
      wl: scheduleGame.gameStatus === 3 ? (scheduleGame.homeTeam_score > scheduleGame.awayTeam_score ? 'W' : 'L') : undefined,
      pts: scheduleGame.homeTeam_score || 0,
      fgm: 0, fga: 0, fg_pct: 0,
      fg3m: 0, fg3a: 0, fg3_pct: 0,
      ftm: 0, fta: 0, ft_pct: 0,
      oreb: 0, dreb: 0, reb: 0,
      ast: 0, stl: 0, blk: 0,
      tov: 0, pf: 0, plus_minus: 0
    };

    const awayTeamStats: NBATeamStats = {
      team_id: scheduleGame.awayTeam_teamId,
      team_abbreviation: scheduleGame.awayTeam_teamTricode || scheduleGame.awayTeam_teamSlug || '???',
      team_name: scheduleGame.awayTeam_teamName || `${scheduleGame.awayTeam_teamCity} ${scheduleGame.awayTeam_teamName}`,
      wl: scheduleGame.gameStatus === 3 ? (scheduleGame.awayTeam_score > scheduleGame.homeTeam_score ? 'W' : 'L') : undefined,
      pts: scheduleGame.awayTeam_score || 0,
      fgm: 0, fga: 0, fg_pct: 0,
      fg3m: 0, fg3a: 0, fg3_pct: 0,
      ftm: 0, fta: 0, ft_pct: 0,
      oreb: 0, dreb: 0, reb: 0,
      ast: 0, stl: 0, blk: 0,
      tov: 0, pf: 0, plus_minus: 0
    };

    // Create the matchup string
    const matchup = `${awayTeamStats.team_abbreviation} @ ${homeTeamStats.team_abbreviation}`;

    return {
      game_date: scheduleGame.gameDate || scheduleGame.gameDateEst || '',
      game_id: scheduleGame.gameId,
      matchup: matchup,
      season_id: scheduleGame.seasonYear || '',
      teams: [homeTeamStats, awayTeamStats],
      game_status: scheduleGame.gameStatusText || (scheduleGame.gameStatus === 1 ? 'Scheduled' : scheduleGame.gameStatus === 2 ? 'Live' : 'Final'),
      game_time: scheduleGame.gameTimeEst,
      arena: scheduleGame.arenaName
    };
  } catch (error) {
    console.error('Error converting game:', error, scheduleGame);
    return null;
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

  // Check if game is in the future (hasn't been played)
  static isFutureGame(game: NBAGame): boolean {
    if (game.teams.length !== 2) return false;
    
    // If both teams have 0 points, it's likely a future game
    const team1 = game.teams[0];
    const team2 = game.teams[1];
    
    return team1.pts === 0 && team2.pts === 0;
  }

  // NEW: Get game status (Scheduled, Live, Final)
  static getGameStatus(game: NBAGame | FullScheduleGame): string {
    if ('gameStatus' in game) {
      // It's a FullScheduleGame
      switch(game.gameStatus) {
        case 1: return 'Scheduled';
        case 2: return 'Live';
        case 3: return 'Final';
        default: return game.gameStatusText || 'Unknown';
      }
    } else {
      // It's an NBAGame
      if (this.isFutureGame(game)) return 'Scheduled';
      if (game.game_status) return game.game_status;
      return 'Final';
    }
  }
}