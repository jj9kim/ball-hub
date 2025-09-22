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
  
  export const getTeamLogoUrl = (teamId: number): string => {
    const abbreviation = teamIdToAbbreviation[teamId];
    return `https://content.rotowire.com/images/teamlogo/basketball/100${abbreviation}.png?v=7`;
  };