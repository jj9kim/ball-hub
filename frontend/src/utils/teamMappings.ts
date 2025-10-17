export const teamIdToAbbreviation: { [key: number]: string } = {
    1: "ATL",
    2: "BOS",
    3: "NOP", 
    4: "CHI",
    5: "CLE",
    6: "DAL",
    7: "DEN",
    8: "DET",
    9: "GSW",
    10: "HOU",
    11: "IND",
    12: "LAC",
    13: "LAL",
    14: "MIA",
    15: "MIL",
    16: "MIN",
    17: "BKN",
    18: "NYK",
    19: "ORL",
    20: "PHI",
    21: "PHX",
    22: "POR",
    23: "SAC",
    24: "SAS",
    25: "OKC",
    26: "UTA",
    27: "WAS",
    28: "TOR",
    29: "MEM",
    5312: "CHA"
  };

  export const teamIdToName: { [key: number]: string } = {
    1: "Hawks",
    2: "Celtics",
    3: "Pelicans", 
    4: "Bulls",
    5: "Cavaliers",
    6: "Mavericks",
    7: "Nuggets",
    8: "Pistons",
    9: "Warriors",
    10: "Rockets",
    11: "Pacers",
    12: "Clippers",
    13: "Lakers",
    14: "Hear",
    15: "Bucks",
    16: "Timberwolves",
    17: "Nets",
    18: "Knicks",
    19: "Magic",
    20: "76ers",
    21: "Suns",
    22: "Trailblazers",
    23: "Kings",
    24: "Spurs",
    25: "Thunder",
    26: "Jazz",
    27: "Wizards",
    28: "Raptors",
    29: "Grizzlies",
    5312: "Hornets"
  };
  
  export const getTeamLogoUrl = (teamId: number): string => {
    const abbreviation = teamIdToAbbreviation[teamId];
    return `https://content.rotowire.com/images/teamlogo/basketball/100${abbreviation}.png?v=7`;
  };

  export const getTeamLogoUrlFromName = (teamShort: string): string => {
    return `https://content.rotowire.com/images/teamlogo/basketball/100${teamShort}.png?v=7`;
  };

  export const getTeamName = (teamId: number): string => {
    const name = teamIdToName[teamId];
    return name;
  }

  export const teamNameToId: { [key: string]: number } = Object.entries(teamIdToName).reduce((acc, [id, name]) => {
    acc[name] = parseInt(id);
    return acc;
}, {} as { [key: string]: number });

export const getTeamId = (teamName: string): number => {
  return teamNameToId[teamName] || -1;
}