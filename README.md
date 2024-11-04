# Globetrotter Travel Tracker - 2024
Made by Edgar Pacheco
Globetrotter is a web-based travel tracker app designed to help users document the countries and cities they have visited or want to visit. Users can view, manage, and interact with map-based data for their travels, with built-in geolocation features and options for printing maps.

Technologie used
Frontend: HTML, CSS and Javascript (native)
Backend: Python and Flask

Features
Interactive Map: A Leaflet.js-powered map displaying countries and cities with distinct markers for "visited" and "want to visit."
Geolocation: Allows users to locate their current position on the map and automatically add their current country to the visited list.
Layer Control: Toggle display for railway routes on the map.
Autocomplete Search: Search for countries and cities to mark as visited or add to the wishlist.
Visit Tracking: Counts and displays the total number of visited countries and cities.
Print Functionality: Save a snapshot of the map in A4 format for easy printing.

To download and run:
python3 -m venv myvenv
source myvenv/bin/activate
pip install Flask
python3 app.py
