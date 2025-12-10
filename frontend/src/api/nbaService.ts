export interface NBAGame {
  SEASON_ID: string;
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  TEAM_NAME: string;
  GAME_ID: string;
  GAME_DATE: string;
  MATCHUP: string;
  WL: string;
  MIN: number;
  PTS: number;
  FGM: number;
  FGA: number;
  FG_PCT: number;
  FG3M: number;
  FG3A: number;
  FG3_PCT: number;
  FTM: number;
  FTA: number;
  FT_PCT: number;
  OREB: number;
  DREB: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  TOV: number;
  PF: number;
  PLUS_MINUS: number;
  // Add other fields as needed based on your data
}

export interface GamesResponse {
  success: boolean;
  games: NBAGame[];
  count: number;
  error?: string;
}

export const fetchNBAGames = async (): Promise<GamesResponse> => {
  try {
    const response = await fetch('http://localhost:5000/api/nba-games');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GamesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching NBA games:', error);
    return {
      success: false,
      games: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};