#!/usr/bin/env python3
import sqlite3
import pandas as pd

def view_database(db_name="basketball_stats.db"):
    conn = sqlite3.connect(db_name)
    
    # Show tables
    tables = pd.read_sql_query("SELECT name FROM sqlite_master WHERE type='table';", conn)
    print("Tables in database:")
    print(tables)
    print("\n" + "="*50 + "\n")
    
    # Show sample from each table
    for table in tables['name']:
        print(f"Sample from {table}:")
        df = pd.read_sql_query(f"SELECT * FROM {table} LIMIT 5;", conn)
        print(df)
        print(f"Total records in {table}: {pd.read_sql_query(f'SELECT COUNT(*) FROM {table}', conn).iloc[0,0]}")
        print("\n" + "-"*30 + "\n")
    
    conn.close()

if __name__ == "__main__":
    view_database()