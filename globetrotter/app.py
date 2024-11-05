# app.py
import json
import gzip
from flask import Flask, render_template, jsonify, request, send_file

app = Flask(__name__)

# Load and cache the data at startup
with open('static/js/countries.geojson') as f:
    geojson_data = json.load(f)

# Load and decompress cities data at startup
with gzip.open('static/js/cities.geojson.gz', 'rt', encoding='utf-8') as f:
    cities_geojson = json.load(f)

# Valid countries and cities
valid_countries = [feature['properties']['ADMIN'] for feature in geojson_data['features']]
valid_cities = [feature['properties']['NAME'] for feature in cities_geojson['features']]

# Store the countries and cities status
visited_countries = []
want_to_visit_countries = []
visited_cities = []
want_to_visit_cities = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cities-data')
def get_cities_data():
    # Return the decompressed cities data
    return jsonify(cities_geojson)

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
            
    return jsonify({
        'visited': visited_countries,
        'want_to_visit': want_to_visit_countries
    })

@app.route('/add-city', methods=['POST'])
def add_city():
    data = request.json
    visited = data.get('visited', [])
    want_to_visit = data.get('want_to_visit', [])
    
    # Validate cities
    visited_cities.clear()
    want_to_visit_cities.clear()
    
    for city in visited:
        if city in valid_cities:
            visited_cities.append(city)
            
    for city in want_to_visit:
        if city in valid_cities:
            want_to_visit_cities.append(city)
            
    return jsonify({
        'visited': visited_cities,
        'want_to_visit': want_to_visit_cities
    })

if __name__ == '__main__':
    app.run(debug=True)