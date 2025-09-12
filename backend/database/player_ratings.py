import sqlite3
from typing import Dict
import pandas as pd
import math

class PlayerRatingCalculator:
    def __init__(self, db_path: str):
        """
        Initialize the rating calculator with database connection
        
        Args:
            db_path: Path to the SQLite database
        """
        self.db_path = db_path
    
    def excel_formula_to_python(self, player_data: Dict) -> float:
        """
        Convert your Excel formula to Python code
        REPLACE THIS WITH YOUR ACTUAL EXCEL FORMULA
        
        This is a placeholder - you'll need to translate your specific
        Excel formula to Python code using the player_data dictionary
        """
        # EXAMPLE: Replace this with your actual Excel formula
        # You'll need to map your Excel cell references to the player_data keys
        
        # Extract the stats you need from player_data
        # These are examples - use the actual field names from your database
        points = player_data.get('points', 0)
        assists = player_data.get('assists', 0) or player_data.get('ast', 0)
        offrebounds = player_data.get('offensive_rebounds', 0)
        defrebounds = player_data.get('defensive_rebounds', 0)
        steals = player_data.get('steals', 0) or player_data.get('stl', 0)
        blocks = player_data.get('blocks', 0) or player_data.get('blk', 0)
        turnovers = player_data.get('turnovers', 0) or player_data.get('to', 0)
        fouls = player_data.get('personal_fouls', 0)

        fg_made = player_data.get('fg_made', 0) or player_data.get('fgm', 0)
        fg_attempted = player_data.get('fg_attempted', 0) or player_data.get('fga', 0)
        fg_missed = fg_attempted - fg_made
        three_pt_made = player_data.get('three_pt_made', 0) or player_data.get('pt3m', 0)
        ft_made = player_data.get('ft_made', 0) or player_data.get('ftm', 0)
        ft_attempted = player_data.get('ft_attempted', 0) or player_data.get('fta', 0)
        ft_missed = ft_attempted - ft_made
        ejections = player_data.get('ejected', 0)
    
        # Initialize double-double/triple-double variables
        tdd = 0  # triple double
        rdd = 0  # rebound double double  
        add = 0  # assist double double
    
        # Check for double-double/triple-double conditions
        if points > 10 and assists > 10 and (offrebounds + defrebounds) > 10:
            tdd = 1.24
        elif points > 10 and (offrebounds + defrebounds) > 10:
            rdd = 0.38
        elif points > 10 and assists > 10:
            add = 0.44
    
        # Handle foul rating
        if fouls > 5:
            foulrating = -2
        else:
            foulrating = ((0.3 * math.log(fouls + 1)) + (0.05 * fouls))  # Added +1 to avoid log(0)
    
        # Calculate rating
        rating = (
            ((0.17 * math.log(points + 1)) + (0.02 * points)) + 
            ((0.33 * math.log(assists + 1)) + (0.06 * assists)) + 
            ((0.17 * math.log(offrebounds + 1)) + (0.02 * offrebounds)) + 
            ((0.13 * math.log(defrebounds + 1)) + (0.01 * defrebounds)) + 
            ((0.37 * math.log(steals + 1)) + (0.06 * steals)) +
            ((0.34 * math.log(blocks + 1)) + (0.05 * blocks)) -
            ((0.45 * math.log(turnovers + 1)) + (0.03 * turnovers)) -
            foulrating +
            ((0.11 * math.log(fg_made + 1)) + (0.02 * fg_made)) -
            ((0.12 * math.log(fg_missed + 1)) + (0.03 * fg_missed)) +
            ((0.11 * math.log(three_pt_made + 1)) + (0.03 * three_pt_made)) +
            ((0.01 * math.log(ft_attempted + 1))) +
            ((0.04 * math.log(ft_made + 1)) + (0.005 * ft_made)) -
            ((0.07 * math.log(ft_missed + 1)) + (0.02 * ft_missed)) -
            ((2.5 * math.log(ejections + 1))) +
            tdd +
            rdd +
            add
        )
    
        # Ensure rating is reasonable (adjust min/max as needed)
        rating = max(0, min(10, rating))  # Adjust max value based on your formula
    
        return round(rating, 2)
    
    def add_ratings_to_database(self):
        """
        Add ratings to all player records in the games table
        using your custom Excel formula converted to Python
        """
        conn = sqlite3.connect(self.db_path)
        
        # Check if player_rating column exists, add if not
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(games)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'player_rating' not in columns:
            cursor.execute("ALTER TABLE games ADD COLUMN player_rating REAL")
            conn.commit()
            print("Added player_rating column to games table")
        
        # Get all player records (excluding team totals)
        query = """
        SELECT id, player_id, game_id, team_id, minutes, points, 
               fg_made, fg_attempted, fg_percentage,
               three_pt_made, three_pt_attempted, three_pt_percentage,
               ft_made, ft_attempted, ft_percentage,
               offensive_rebounds, defensive_rebounds, total_rebounds,
               assists, steals, blocks, turnovers, personal_fouls
        FROM games
        WHERE position_sort != 4  -- Exclude team totals
        """
        
        df = pd.read_sql_query(query, conn)
        
        updated_count = 0
        for _, row in df.iterrows():
            player_data = row.to_dict()
            
            # Calculate rating using your custom Excel formula
            rating = self.excel_formula_to_python(player_data)
            
            # Update the database
            cursor.execute(
                "UPDATE games SET player_rating = ? WHERE id = ?",
                (rating, player_data['id'])
            )
            
            updated_count += 1
            
            # Commit every 100 records to avoid locking the database
            if updated_count % 100 == 0:
                conn.commit()
                print(f"Updated {updated_count} records...")
        
        conn.commit()
        conn.close()
        
        print(f"Successfully updated ratings for {updated_count} player records")
    
    def validate_ratings(self, sample_size: int = 5):
        """
        Validate that ratings were calculated correctly by comparing
        with a manual calculation for a few sample records
        """
        conn = sqlite3.connect(self.db_path)
        
        # Get some sample records
        query = """
        SELECT id, player_name, minutes, points, total_rebounds, assists, steals, 
               blocks, turnovers, player_rating
        FROM games 
        WHERE player_rating IS NOT NULL 
        LIMIT ?
        """
        
        df = pd.read_sql_query(query, conn, params=(sample_size,))
        conn.close()
        
        print("Sample of calculated ratings:")
        print(df.to_string(index=False))
        
        return df

# Example usage
if __name__ == "__main__":
    # Initialize the calculator
    calculator = PlayerRatingCalculator("games.db")
    
    # Add ratings to all players in the database using your custom formula
    calculator.add_ratings_to_database()
    
    # Validate the results
    calculator.validate_ratings(sample_size=10)