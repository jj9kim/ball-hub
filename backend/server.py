from flask import Flask, jsonify, send_from_directory
import threading
import time
import math
import pandas as pd
import working  # Import module instead of specific functions
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend')

CORS(app)

CACHE = {
    "data": [],
    "last_updated": None,
    "error": None
}

def update_cache():
    while True:
        try:
            print("Starting data update...")
            df = working.get_data()
            
            # Debug: Print raw DataFrame info
            print(f"DataFrame shape: {df.shape}")
            print("Sample data:", df.head().to_dict())
            
            if isinstance(df, pd.DataFrame) and not df.empty:
                # Convert to dict and ensure required fields exist
                records = df.to_dict(orient='records')
                
                # Validate required fields (match what app.js expects)
                required_fields = ['nameShort', 'nameLong', 'position', 'fg_made', 'fg_attempted', 'points']
                valid_records = []
                for record in records:
                    if all(field in record for field in required_fields):
                        valid_records.append(record)
                
                if valid_records:
                    CACHE.update({
                        "data": valid_records,
                        "error": None,
                        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
                    })
                    print(f"Updated {len(valid_records)} valid records")
                else:
                    CACHE.update({
                        "data": [],
                        "error": "Missing required fields in data",
                        "last_updated": None
                    })
                    print("Warning: Data missing required fields")
            else:
                CACHE.update({
                    "data": [],
                    "error": "Empty or invalid DataFrame",
                    "last_updated": None
                })
            
        except Exception as e:
            error_msg = f"Update error: {str(e)}"
            print(error_msg)
            CACHE.update({
                "data": [],
                "error": error_msg,
                "last_updated": None
            })
        
        # Sleep for 60 seconds (better than chunked sleep)
        time.sleep(60)

@app.route('/api/data')
def api_data():
    def clean_nans(data):
        if isinstance(data, dict):
            return {k: clean_nans(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [clean_nans(item) for item in data]
        elif isinstance(data, float) and math.isnan(data):
            return None
        return data

    cleaned_data = clean_nans(CACHE["data"])
    return jsonify({
        "success": bool(cleaned_data),
        "data": cleaned_data,
        "last_updated": CACHE["last_updated"],
        "error": CACHE["error"],
        "count": len(cleaned_data)
    })

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    # First start the background updater thread
    updater = threading.Thread(target=update_cache, daemon=True)
    updater.start()
    
    # Then start the Flask server
    app.run(host='0.0.0.0', port=5001, debug=True)
    
    