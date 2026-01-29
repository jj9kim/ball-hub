export const teamIdToAbbreviation: { [key: number]: string } = {
    1610612737: "ATL",
    1610612738: "BOS",
    1610612740: "NOP", 
    1610612741: "CHI",
    1610612739: "CLE",
    1610612742: "DAL",
    1610612743: "DEN",
    1610612765: "DET",
    1610612744: "GSW",
    1610612745: "HOU",
    1610612754: "IND",
    1610612746: "LAC",
    1610612747: "LAL",
    1610612748: "MIA",
    1610612749: "MIL",
    1610612750: "MIN",
    1610612751: "BKN",
    1610612752: "NYK",
    1610612753: "ORL",
    1610612755: "PHI",
    1610612756: "PHX",
    1610612757: "POR",
    1610612758: "SAC",
    1610612759: "SAS",
    1610612760: "OKC",
    1610612762: "UTA",
    1610612764: "WAS",
    1610612761: "TOR",
    1610612763: "MEM",
    1610612766: "CHA"
  };

  export const teamIdToName: { [key: number]: string } = {
    1610612737: "Hawks",
    1610612738: "Celtics",
    1610612740: "Pelicans", 
    1610612741: "Bulls",
    1610612739: "Cavaliers",
    1610612742: "Mavericks",
    1610612743: "Nuggets",
    1610612765: "Pistons",
    1610612744: "Warriors",
    1610612745: "Rockets",
    1610612754: "Pacers",
    1610612746: "Clippers",
    1610612747: "Lakers",
    1610612748: "Heat",
    1610612749: "Bucks",
    1610612750: "Timberwolves",
    1610612751: "Nets",
    1610612752: "Knicks",
    1610612753: "Magic",
    1610612755: "76ers",
    1610612756: "Suns",
    1610612757: "Trailblazers",
    1610612758: "Kings",
    1610612759: "Spurs",
    1610612760: "Thunder",
    1610612762: "Jazz",
    1610612764: "Wizards",
    1610612761: "Raptors",
    1610612763: "Grizzlies",
    1610612766: "Hornets"
  };

  export const getTeamFullName = (abbreviation: string): string => {
    const teamMap: Record<string, string> = {
        'ATL': 'Atlanta Hawks',
        'BOS': 'Boston Celtics',
        'BKN': 'Brooklyn Nets',
        'CHA': 'Charlotte Hornets',
        'CHI': 'Chicago Bulls',
        'CLE': 'Cleveland Cavaliers',
        'DAL': 'Dallas Mavericks',
        'DEN': 'Denver Nuggets',
        'DET': 'Detroit Pistons',
        'GSW': 'Golden State Warriors',
        'HOU': 'Houston Rockets',
        'IND': 'Indiana Pacers',
        'LAC': 'LA Clippers',
        'LAL': 'Los Angeles Lakers',
        'MEM': 'Memphis Grizzlies',
        'MIA': 'Miami Heat',
        'MIL': 'Milwaukee Bucks',
        'MIN': 'Minnesota Timberwolves',
        'NOP': 'New Orleans Pelicans',
        'NYK': 'New York Knicks',
        'OKC': 'Oklahoma City Thunder',
        'ORL': 'Orlando Magic',
        'PHI': 'Philadelphia 76ers',
        'PHX': 'Phoenix Suns',
        'POR': 'Portland Trail Blazers',
        'SAC': 'Sacramento Kings',
        'SAS': 'San Antonio Spurs',
        'TOR': 'Toronto Raptors',
        'UTA': 'Utah Jazz',
        'WAS': 'Washington Wizards',
    };
    
    return teamMap[abbreviation] || abbreviation;
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

export const calculatePlayerRating = (player: any): number => {
        let tdd = 0, rdd = 0, add = 0, foulrating = 0;        
        
        if (player.points > 10 && player.assists > 10 && player.rebounds > 10) {
            tdd = 1.24;
        } else if (player.points > 10 && player.rebounds > 10) {
            rdd = 0.38;
        } else if (player.points > 10 && player.assists > 10) {
            add = 0.44;
        }

        if (player.fouls > 5) {
            foulrating = 2;
        } else {
            foulrating = ((0.3 * Math.log(player.fouls + 1)) + 0.05 * player.fouls);
        }


        let rating = ((0.17 * Math.log(player.points + 1)) + (0.02 * player.points)) +
            ((0.33 * Math.log(player.assists + 1)) + (0.06 * player.assists)) +
            ((0.14 * Math.log(player.rebounds + 1)) + (0.02 * player.rebounds)) +
            ((0.37 * Math.log(player.steals + 1)) + (0.06 * player.steals)) +
            ((0.34 * Math.log(player.blocks + 1)) + (0.05 * player.blocks)) -
            ((0.45 * Math.log(player.turnovers + 1)) + (0.03 * player.turnovers)) -
            foulrating +
            ((0.11 * Math.log(player.fg_made + 1)) + (0.02 * player.fg_made)) -
            ((0.12 * Math.log(player.fg_missed + 1)) + (0.03 * player.fg_missed)) +
            ((0.11 * Math.log(player.three_made + 1)) + (0.03 * player.three_made)) +
            ((0.01 * Math.log(player.ft_attempted + 1))) +
            ((0.04 * Math.log(player.ft_made + 1)) + (0.005 * player.ft_made)) -
            ((0.07 * Math.log(player.ft_missed + 1)) + (0.02 * player.ft_missed)) -
            ((2.5 * Math.log(player.ejections + 1))) +
            tdd +
            rdd +
            add

        rating = Math.max(0, Math.min(10, (6 + rating)));

        return Number(rating.toFixed(2));
    };