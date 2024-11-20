import json
import pandas as pd
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Store the countries and cities status
visited_countries = []
want_to_visit_countries = []
visited_cities = []
want_to_visit_cities = []
# Load city data from CSV using pandas
city_data = pd.read_csv("static/js/worldcities.csv")
city_data = city_data.fillna("")
city_data = city_data.to_dict("records")

# Load country and city data
with open("static/js/countries.geojson") as f:
    geojson_data = json.load(f)


@app.route("/city-data", methods=["GET"])
def get_city_data():
    # Convert NaN values to null for valid JSON
    city_data_json = [
        {k: (v if v != "" else None) for k, v in row.items()} for row in city_data
    ]
    return jsonify(city_data_json)


# Valid countries and cities
valid_countries = [
    feature["properties"]["ADMIN"] for feature in geojson_data["features"]
]
valid_cities = city_data.copy()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/add-country", methods=["POST"])
def add_country():
    data = request.json
    visited = data.get("visited", [])
    want_to_visit = data.get("want_to_visit", [])
    # Validate countries
    visited_countries.clear()
    want_to_visit_countries.clear()
    for country in visited:
        if country in valid_countries:
            visited_countries.append(country)
    for country in want_to_visit:
        if country in valid_countries:
            want_to_visit_countries.append(country)
    return jsonify(
        {"visited": visited_countries, "want_to_visit": want_to_visit_countries}
    )


@app.route("/add-city", methods=["POST"])
def add_city():
    data = request.json
    visited = data.get("visited", [])
    want_to_visit = data.get("want_to_visit", [])
    # Validate cities
    visited_cities.clear()
    want_to_visit_cities.clear()
    for city in visited:
        if city in [row["city"] for row in valid_cities]:
            visited_cities.append(city)
            print(f"City added to visited: {city}")
    for city in want_to_visit:
        if city in [row["city"] for row in valid_cities]:
            want_to_visit_cities.append(city)
            print(f"City added to want_to_visit: {city}")
    return jsonify({"visited": visited_cities, "want_to_visit": want_to_visit_cities})


@app.route("/countries", methods=["GET"])
def get_countries():
    return jsonify(valid_countries)


@app.route("/cities", methods=["GET"])
def get_cities():
    return jsonify([row["city"] for row in valid_cities])


if __name__ == "__main__":
    app.run(debug=True)
