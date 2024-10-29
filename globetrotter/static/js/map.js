// Center the map on the world
var map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

var visitedCountries = [];
var wantToVisitCountries = [];
var visitedCities = [];
var wantToVisitCities = [];
var countryLayer = null;
var cityMarkers = new L.LayerGroup().addTo(map);
var validCities = [];  // Global variable to hold valid cities
var cityCoordinates = {}; // Global object to hold city coordinates

// Function to toggle between country and city tabs
function showTab(tab) {
    document.getElementById('countries-tab').style.display = tab === 'countries' ? 'block' : 'none';
    document.getElementById('cities-tab').style.display = tab === 'cities' ? 'block' : 'none';
}

// Load GeoJSON data for countries
fetch('/static/js/countries.geojson')
    .then(response => response.json())
    .then(data => {
        countryLayer = L.geoJSON(data, {
            style: {
                color: "#3388ff",
                weight: 1,
                fillOpacity: 0.2
            },
            onEachFeature: function (feature, layer) {
                const countryName = feature.properties.ADMIN;

                // Click event for each country
                layer.on('click', function () {
                    handleCountryClick(countryName);
                });
            }
        }).addTo(map);

        // Autocomplete
        var countryList = data.features.map(feature => feature.properties.ADMIN);
        populateAutocomplete(countryList);
    });

// Load GeoJSON data for cities
fetch('/static/js/cities.geojson')
    .then(response => response.json())
    .then(data => {
        // Populate cityCoordinates object with city names and their coordinates
        data.features.forEach(feature => {
            const cityName = feature.properties.NAME;
            const coordinates = feature.geometry.coordinates;
            cityCoordinates[cityName] = [coordinates[1], coordinates[0]]; // Assuming coordinates are in [lon, lat]
        });

        // Fetch valid city names for autocomplete
        validCities = data.features.map(feature => feature.properties.NAME); // Store valid cities in the global variable
        populateCityAutocomplete(validCities);
    });

// Function to handle country clicks
function handleCountryClick(countryName) {
    if (visitedCountries.includes(countryName)) {
        if (confirm(`Remove ${countryName} from the visited list?`)) {
            visitedCountries = visitedCountries.filter(c => c !== countryName);
        }
    } else if (wantToVisitCountries.includes(countryName)) {
        if (confirm(`Remove ${countryName} from the want to visit list?`)) {
            wantToVisitCountries = wantToVisitCountries.filter(c => c !== countryName);
        }
    } else {
        var popupContent = `
         <div style="text-align: center;">
                <strong>${countryName}</strong><br>
                <button onclick="addCountryToList('${countryName}', 'visited'); closePopup()"
                    style="background-color: #ff9500; color: white; border: none; padding: 5px 10px; margin-top: 5px; cursor: pointer;">
                    Add to Visited
                </button>
                <button onclick="addCountryToList('${countryName}', 'want_to_visit'); closePopup()"
                    style="background-color: #5A00FF; color: white; border: none; padding: 5px 10px; margin-top: 5px; margin-left: 5px; cursor: pointer;">
                    Add to Want to Visit
                </button>
            </div>
    `;
        countryLayer.eachLayer(function (layer) {
            if (layer.feature.properties.ADMIN === countryName) {
                layer.bindPopup(popupContent).openPopup();
            }
        });
    }
    updateMap();
}

function closePopup() {
    map.closePopup();
    updateMap(); 
}

// Populate autocomplete list
function populateAutocomplete(countries) {
    var dataList = document.getElementById('countryList');
    dataList.innerHTML = '';
    var uniqueCountries = new Set(countries);

    uniqueCountries.forEach(country => {
        var option = document.createElement('option');
        option.value = country;
        dataList.appendChild(option);
    });
}

// Add country to visited or want-to-visit list
function addCountry(status) {
    var countryName = document.getElementById('countrySearch').value;
    if (!countryName) return alert('Please enter a country name');

    addCountryToList(countryName, status);
    updateMap();
}

// Helper function for country management
function addCountryToList(countryName, status) {
    visitedCountries = visitedCountries.filter(c => c !== countryName);
    wantToVisitCountries = wantToVisitCountries.filter(c => c !== countryName);

    if (status === 'visited') {
        visitedCountries.push(countryName);
    } else if (status === 'want_to_visit') {
        wantToVisitCountries.push(countryName);
    }
}

// Logic for Cities

// Add city to a specific list
function addCity(status) {
    var cityName = document.getElementById('citySearch').value;
    if (!cityName) return alert('Please enter a city name');

    // Validate against validCities
    if (!validCities.includes(cityName)) {
        return alert('City is not valid or does not exist.');
    }

    addCityToList(cityName, status);
    updateMap();
}

// Add city to either visited or want-to-visit list and display marker
function addCityToList(cityName, status) {
    visitedCities = visitedCities.filter(c => c !== cityName);
    wantToVisitCities = wantToVisitCities.filter(c => c !== cityName);

    if (status === 'visited') {
        visitedCities.push(cityName);
        addCityMarker(cityName, '#ff9500'); // Add marker for visited city
    } else if (status === 'want_to_visit') {
        wantToVisitCities.push(cityName);
        addCityMarker(cityName, '#5A00FF'); // Add marker for want-to-visit city
    }
}

// Function to add a city marker on the map
function addCityMarker(cityName, color) {
    const lat = cityData.latitude;  // Ensure this is defined
    const lng = cityData.longitude;  // Ensure this is defined

    if (lat === undefined || lng === undefined) {
        console.error("Latitude or Longitude is undefined for city:", cityData);
        return; // Prevent further execution
    }
    
    var coordinates = getCityCoordinates(cityName);
    console.log("Adding city marker for:", cityName, "Coordinates:", coordinates);
    if (!coordinates) {
        return alert(`City "${cityName}" not found or invalid coordinates.`);
    }

    // Create the marker using the valid coordinates
    var marker = L.circleMarker(coordinates, {
        radius: 6,
        color: color,
        fillColor: color,
        fillOpacity: 0.9
    }).bindPopup(cityName).addTo(cityMarkers);
}
// Function to get coordinates for a city from the city GeoJSON data
function getCityCoordinates(cityName) {
    const coordinates = cityCoordinates[cityName];
    if (!coordinates) {
        console.error(`Coordinates not found for city: ${cityName}`);
        return null; // Return null if city is not found
    }
    return coordinates; // Return the valid coordinates
}

// Function to update the map colors and markers
function updateMap() {
    fetch('/add-country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visited: visitedCountries, want_to_visit: wantToVisitCountries })
    })
        .then(response => response.json())
        .then(data => {
            visitedCountries = data.visited;
            wantToVisitCountries = data.want_to_visit;

            // Update country colors
            countryLayer.eachLayer(function (layer) {
                var countryName = layer.feature.properties.ADMIN;
                if (visitedCountries.includes(countryName)) {
                    layer.setStyle({ color: '#ff9500', fillOpacity: 0.5 });
                } else if (wantToVisitCountries.includes(countryName)) {
                    layer.setStyle({ color: '#5A00FF', fillOpacity: 0.5 });
                } else {
                    layer.setStyle({ color: '#3388ff', fillOpacity: 0.2 });
                }
            });

            // Clear and re-add city markers
            cityMarkers.clearLayers();
            visitedCities.forEach(city => addCityMarker(city, '#ff9500'));
            wantToVisitCities.forEach(city => addCityMarker(city, '#5A00FF'));
        })
        .catch(err => console.error('Error:', err));
}

// Populate city autocomplete list
function populateCityAutocomplete(cities) {
    var dataList = document.getElementById('cityList');
    dataList.innerHTML = '';
    var uniqueCities = new Set(cities);

    uniqueCities.forEach(city => {
        var option = document.createElement('option');
        option.value = city;
        dataList.appendChild(option);
    });
}

// Function to show countries tab
function showCountries() {
    document.getElementById('countriesTab').classList.add('active');
    document.getElementById('citiesTab').classList.remove('active');
    document.getElementById('countrySearchSection').classList.remove('hidden');
    document.getElementById('citySearchSection').classList.add('hidden');
}

// Function to show cities tab
function showCities() {
    document.getElementById('citiesTab').classList.add('active');
    document.getElementById('countriesTab').classList.remove('active');
    document.getElementById('citySearchSection').classList.remove('hidden');
    document.getElementById('countrySearchSection').classList.add('hidden');
}
