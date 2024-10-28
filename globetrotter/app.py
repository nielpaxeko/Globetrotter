import json
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Store the countries status
visited_countries = []
want_to_visit_countries = []

# Load country GeoJSON data
with open('static/js/countries.geojson') as f:
    geojson_data = json.load(f)

# Extract a list of valid country names from the GeoJSON
valid_countries = [feature['properties']['ADMIN'] for feature in geojson_data['features']]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add-country', methods=['POST'])
def add_country():
    data = request.json
    visited = data.get('visited', [])
    want_to_visit = data.get('want_to_visit', [])

    # Validate countries
    visited_countries.clear()
    want_to_visit_countries.clear()

    for country in visited:
        if country in valid_countries:
            visited_countries.append(country)

    for country in want_to_visit:
        if country in valid_countries:
            want_to_visit_countries.append(country)

    return jsonify({'visited': visited_countries, 'want_to_visit': want_to_visit_countries})

@app.route('/reset', methods=['POST'])
def reset_countries():
    visited_countries.clear()
    want_to_visit_countries.clear()
    return jsonify({'message': 'Countries lists reset'})

@app.route('/countries', methods=['GET'])
def get_countries():
    return jsonify(valid_countries)

if __name__ == '__main__':
    app.run(debug=True)
