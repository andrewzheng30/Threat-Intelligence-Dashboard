import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Flask setup
app = Flask(__name__)
CORS(app)

# Fetch NVD API Key
NVD_API_KEY = os.getenv("NVD_API_KEY")
if not NVD_API_KEY:
    print("❌ NVD_API_KEY not found in environment. Please check your .env file.")
else:
    print("✅ NVD_API_KEY loaded successfully.")

@app.route("/api/cves")
def get_recent_cves():
    if not NVD_API_KEY:
        return jsonify({"error": "Missing NVD API Key."}), 500

    base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"

    # Get CVEs from past 3 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=3)

    params = {
        "resultsPerPage": 100,
        "pubStartDate": start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "pubEndDate": end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    }

    headers = {
        "apiKey": NVD_API_KEY
    }

    try:
        response = requests.get(base_url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        results = []
        for item in data.get("vulnerabilities", []):
            cve = item.get("cve", {})
            results.append({
                "id": cve.get("id"),
                "published": cve.get("published"),
                "severity": cve.get("metrics", {}).get("cvssMetricV31", [{}])[0].get("cvssData", {}).get("baseSeverity", "Unknown"),
                "summary": cve.get("descriptions", [{}])[0].get("value", "No description available.")
            })

        return jsonify(results)
    except requests.RequestException as e:
        return jsonify({
            "error": "Request to NVD API failed.",
            "details": str(e)
        }), 500

# Run the server
if __name__ == "__main__":
    app.run(debug=True)


