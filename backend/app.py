import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from the .env file (e.g., NVD_API_KEY)
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Enable CORS so your frontend (React) can call this backend without issues
CORS(app)

# Retrieve NVD API key from environment variables
NVD_API_KEY = os.getenv("NVD_API_KEY")
if not NVD_API_KEY:
    print("❌ NVD_API_KEY not found in environment. Please check your .env file.")
else:
    print("✅ NVD_API_KEY loaded successfully.")

# Define API endpoint: http://127.0.0.1:5000/api/cves
@app.route("/api/cves")
def get_recent_cves():
    # Fail early if API key is missing
    if not NVD_API_KEY:
        return jsonify({"error": "Missing NVD API Key."}), 500

    base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"

    # Query CVEs from the past 3 days
    end_date = datetime.utcnow()                  # Current UTC time
    start_date = end_date - timedelta(days=3)     # 3 days ago

    # Query parameters for the NVD API
    params = {
        "resultsPerPage": 100,   # Maximum results per request
        "pubStartDate": start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "pubEndDate": end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    }

    # API key in headers
    headers = {
        "apiKey": NVD_API_KEY
    }

    try:
        # Send GET request to NVD API
        response = requests.get(base_url, headers=headers, params=params)
        response.raise_for_status()  # Raise error if status != 200
        data = response.json()       # Parse JSON response

        results = []
        # Extract key info from each CVE entry
        for item in data.get("vulnerabilities", []):
            cve = item.get("cve", {})
            results.append({
                "id": cve.get("id"),  # CVE identifier (e.g., CVE-2025-1234)
                "published": cve.get("published"),  # Publish date
                # Extract severity from CVSS v3.1 metrics (if available)
                "severity": cve.get("metrics", {}).get("cvssMetricV31", [{}])[0]
                            .get("cvssData", {}).get("baseSeverity", "Unknown"),
                # Get first description (fallback if none available)
                "summary": cve.get("descriptions", [{}])[0]
                            .get("value", "No description available.")
            })

        # Return JSON response to frontend
        return jsonify(results)
    except requests.RequestException as e:
        # Catch network or API errors
        return jsonify({
            "error": "Request to NVD API failed.",
            "details": str(e)
        }), 500

# Run Flask app in debug mode 
if __name__ == "__main__":
    app.run(debug=True)
