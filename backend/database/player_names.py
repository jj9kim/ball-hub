import sqlite3
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import pandas as pd
import re

class PlayerNameScraper:
    def __init__(self, db_name: str = "player_stats.db"):
        self.db_name = db_name
        self.base_url = "https://www.rotowire.com/basketball/player/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0',
        }
        # Cache of known player ID to name mappings
        self.known_players = {
            3014: "stephen-curry",
            3444: "dennis-schroder", 
            6227: "jackson-rowe",
            # Add more known mappings as you discover them
        }
    
    def ensure_player_name_column(self):
        """Make sure the players table has a player_name column"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        try:
            # Check if player_name column exists
            cursor.execute("PRAGMA table_info(players)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'player_name' not in columns:
                print("Adding player_name column to players table...")
                cursor.execute("ALTER TABLE players ADD COLUMN player_name TEXT")
                conn.commit()
                print("player_name column added successfully")
            else:
                print("player_name column already exists")
                
        except Exception as e:
            print(f"Error ensuring player_name column exists: {e}")
        finally:
            conn.close()
    
    def get_player_ids_in_range(self, start_id, end_id):
        """Get player IDs in a specific range from the database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        cursor.execute("SELECT player_id FROM players WHERE player_id BETWEEN ? AND ? ORDER BY player_id", 
                      (start_id, end_id))
        player_ids = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return player_ids
    
    def player_has_name(self, player_id):
        """Check if a player already has a name in the database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        try:
            # First check if the column exists
            cursor.execute("PRAGMA table_info(players)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'player_name' not in columns:
                return False  # Column doesn't exist, so no players have names
            
            # Check if this player has a name
            cursor.execute("SELECT player_name FROM players WHERE player_id = ?", (player_id,))
            result = cursor.fetchone()
            
            return result and result[0] is not None
            
        except Exception as e:
            print(f"Error checking if player {player_id} has name: {e}")
            return False
        finally:
            conn.close()
    
    def extract_name_from_known_players(self, player_id):
        """Try to get name from our known players mapping"""
        return self.known_players.get(player_id)
    
    def try_direct_url(self, player_id):
        """Try the direct URL approach first"""
        url = f"{self.base_url}{player_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10, allow_redirects=True)
            response.raise_for_status()
            
            # If we were redirected, extract name from the redirected URL
            if response.url != url:
                redirected_url = response.url
                if "/player/" in redirected_url:
                    parts = redirected_url.split("/")
                    player_part = parts[-1]  # Gets "dennis-schroder-3444"
                    
                    if "-" in player_part and player_part.endswith(str(player_id)):
                        name_part = player_part.rsplit("-", 1)[0]  # Gets "dennis-schroder"
                        name = name_part.replace("-", " ").title()  # Gets "Dennis Schroder"
                        return name
            
            # If not redirected, try to extract from the page title
            soup = BeautifulSoup(response.content, 'html.parser')
            title = soup.find('title')
            
            if title:
                # Title format: "Dennis Schroder Stats, News, Bio | Rotowire.com"
                title_text = title.get_text()
                if "| Rotowire.com" in title_text:
                    name = title_text.split("|")[0].replace("Stats", "").replace("News", "").replace("Bio", "").strip()
                    return name
                    
        except requests.exceptions.RequestException:
            # This URL approach failed, we'll try other methods
            pass
        except Exception as e:
            print(f"Error parsing page for player {player_id}: {e}")
        
        return None
    
    def try_search_method(self, player_id):
        """Alternative method: search for the player using Rotowire's search"""
        search_url = "https://www.rotowire.com/basketball/search.php"
        
        try:
            # First try to search by ID
            params = {"search": str(player_id)}
            response = requests.get(search_url, params=params, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for player links in search results
            player_links = soup.find_all('a', href=re.compile(r'/basketball/player/'))
            
            for link in player_links:
                href = link.get('href', '')
                if f"-{player_id}" in href:
                    # Found a matching player link
                    parts = href.split("/")
                    player_part = parts[-1]  # Gets "dennis-schroder-3444"
                    
                    if "-" in player_part and player_part.endswith(str(player_id)):
                        name_part = player_part.rsplit("-", 1)[0]  # Gets "dennis-schroder"
                        name = name_part.replace("-", " ").title()  # Gets "Dennis Schroder"
                        return name
            
            # If no results by ID, try to find any NBA players
            player_links = soup.find_all('a', href=re.compile(r'/basketball/player/'))
            for link in player_links:
                href = link.get('href', '')
                if "/basketball/player/" in href and "-" in href:
                    # Extract name from any player link
                    parts = href.split("/")
                    player_part = parts[-1]
                    
                    if "-" in player_part:
                        try:
                            # Extract ID from the URL
                            url_id = int(player_part.split("-")[-1])
                            if url_id == player_id:
                                name_part = player_part.rsplit("-", 1)[0]
                                name = name_part.replace("-", " ").title()
                                return name
                        except (ValueError, IndexError):
                            continue
                            
        except requests.exceptions.RequestException as e:
            print(f"Search failed for player {player_id}: {e}")
        except Exception as e:
            print(f"Error with search method for player {player_id}: {e}")
        
        return None
    
    def try_known_players_method(self, player_id):
        """Try to find the player by testing known player URLs with this ID"""
        # Test with known player name slugs but this ID
        test_names = ["stephen-curry", "lebron-james", "kevin-durant", "james-harden", 
                     "giannis-antetokounmpo", "nikola-jokic", "joel-embiid", "luka-doncic"]
        
        for test_name in test_names:
            test_url = f"{self.base_url}{test_name}-{player_id}"
            
            try:
                response = requests.get(test_url, headers=self.headers, timeout=5, allow_redirects=True)
                
                # If we get a successful response and it's not a redirect to a different ID
                if response.status_code == 200:
                    final_url = response.url
                    
                    # Check if this is the correct player (URL ends with our ID)
                    if final_url.endswith(str(player_id)):
                        # Extract name from the final URL
                        parts = final_url.split("/")
                        player_part = parts[-1]
                        
                        if "-" in player_part and player_part.endswith(str(player_id)):
                            name_part = player_part.rsplit("-", 1)[0]
                            name = name_part.replace("-", " ").title()
                            return name
                            
            except requests.exceptions.RequestException:
                continue
        
        return None
    
    def extract_name_from_url(self, player_id):
        """Extract player name using multiple methods"""
        # Method 1: Try known players mapping first
        known_slug = self.extract_name_from_known_players(player_id)
        if known_slug:
            return known_slug.replace("-", " ").title()
        
        # Method 2: Try direct URL access
        name = self.try_direct_url(player_id)
        if name:
            return name
        
        # Method 3: Try search method
        name = self.try_search_method(player_id)
        if name:
            return name
        
        # Method 4: Try known players method (testing common names with this ID)
        name = self.try_known_players_method(player_id)
        if name:
            return name
        
        print(f"All methods failed for player {player_id}")
        return None
    
    def update_player_name(self, player_id, player_name):
        """Update the player name in the database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        try:
            # First, make sure the column exists
            cursor.execute("PRAGMA table_info(players)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'player_name' not in columns:
                cursor.execute("ALTER TABLE players ADD COLUMN player_name TEXT")
            
            # Update the player name
            cursor.execute(
                "UPDATE players SET player_name = ?, scraped_timestamp = ? WHERE player_id = ?",
                (player_name, datetime.now(), player_id)
            )
            
            conn.commit()
            print(f"Updated player {player_id} with name: {player_name}")
            
        except Exception as e:
            print(f"Error updating player {player_id}: {e}")
        finally:
            conn.close()
    
    def scrape_names_for_range(self, start_id, end_id, delay=1.0):
        """Scrape names for players in a specific ID range"""
        # First, ensure the player_name column exists
        self.ensure_player_name_column()
        
        player_ids = self.get_player_ids_in_range(start_id, end_id)
        
        if not player_ids:
            print(f"No players found in database with IDs between {start_id} and {end_id}")
            # Try to scrape names for IDs in range even if they're not in database yet
            player_ids = list(range(start_id, end_id + 1))
            print(f"Will attempt to scrape names for IDs: {player_ids}")
        
        total_players = len(player_ids)
        print(f"Processing {total_players} players from ID {start_id} to {end_id}")
        
        successful = 0
        failed = 0
        
        for i, player_id in enumerate(player_ids, 1):
            print(f"Processing player {i}/{total_players} (ID: {player_id})")
            
            # Check if player already has a name (using our safe method)
            if self.player_has_name(player_id):
                print(f"Player {player_id} already has a name, skipping...")
                successful += 1
                continue
            
            # Extract name from URL using multiple methods
            player_name = self.extract_name_from_url(player_id)
            
            if player_name:
                self.update_player_name(player_id, player_name)
                successful += 1
                
                # Add to known players for future reference
                name_slug = player_name.lower().replace(" ", "-")
                self.known_players[player_id] = name_slug
            else:
                print(f"Could not extract name for player {player_id}")
                failed += 1
            
            time.sleep(delay)  # Be respectful to the server
        
        print(f"Finished scraping player names. Successful: {successful}, Failed: {failed}")
        return successful, failed

# Example usage with range
if __name__ == "__main__":
    scraper = PlayerNameScraper()
    
    # Test with known players first
    start_id = 1500
    end_id = 2000
    
    scraper.scrape_names_for_range(start_id, end_id, delay=1.0)
    
    # Verify the results for the range
    conn = sqlite3.connect("player_stats.db")
    players_in_range = pd.read_sql_query(
        f"SELECT player_id, player_name, team FROM players WHERE player_id BETWEEN {start_id} AND {end_id} ORDER BY player_id", 
        conn
    )
    print(f"\nPlayers in range {start_id}-{end_id}:")
    print(players_in_range)
    
    conn.close()