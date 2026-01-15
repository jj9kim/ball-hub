// assets/components/teamprofile/types/index.ts
export interface Player {
    player_id: number;
    player_name: string;
    display_name: string;
    jersey_number: string;
    position: string;
    height: string;
    height_raw: string;
    weight: string;
    weight_raw: number | null;
    birth_date: string;
    age: number | null;
    experience: string;
    experience_raw: string;
    college: string;
    country: string;
    how_acquired: string;
}

export interface Coach {
    coach_name: string;
    coach_type: string;
    is_assistant: boolean;
    sort_sequence: number;
}

export interface RosterData {
    players: Player[];
    coaches: Coach[];
    player_count: number;
    coach_count: number;
}

export interface TeamBasicInfo {
    team_id: number;
    team_name: string;
    team_city: string;
    full_name: string;
}

export type TeamProfileTabType = 'overview' | 'standings' | 'matches' | 'roster' | 'stats';