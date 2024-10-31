// --- Map Setup ---
var map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// --- Global Variables ---
var visitedCountries = [];
var wantToVisitCountries = [];
var visitedCities = [];
var wantToVisitCities = [];
var countryLayer = null;
var cityMarkers = new L.LayerGroup().addTo(map);
var validCities = [];
var cityCoordinates = {};
var cities_geojson;

// --- Load Data ---

fetch('/static/js/cities.geojson')
    .then(response => response.json())
    .then(data => {
        cities_geojson = data;
        // data.features.forEach(feature => {
        //     const cityName = feature.properties.NAME;
        //     cityCoordinates[cityName] = getCityCoordinates(cityName);
        // });
        validCities = data.features.map(feature => feature.properties.NAME);
        populateCityAutocomplete(validCities);
    });

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

// --- Country Logic ---
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

// Add country to visited or want-to-visit list
function addCountryToList(countryName, status) {
    visitedCountries = visitedCountries.filter(c => c !== countryName);
    wantToVisitCountries = wantToVisitCountries.filter(c => c !== countryName);

    if (status === 'visited') {
        visitedCountries.push(countryName);
        zoomToCountry(countryName);
    } else if (status === 'want_to_visit') {
        wantToVisitCountries.push(countryName);
        zoomToCountry(countryName);
    }
}

// Function to zoom into the country on the map
function zoomToCountry(countryName) {
    countryLayer.eachLayer(function (layer) {
        if (layer.feature.properties.ADMIN === countryName) {
            map.fitBounds(layer.getBounds(), { maxZoom: 9 });
        }
    });
}

// --- City Logic ---

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
        addCityMarker(cityName, '#ff9500');
        zoomToCity(cityName); // Zoom into the city
    } else if (status === 'want_to_visit') {
        wantToVisitCities.push(cityName);
        addCityMarker(cityName, '#5A00FF');
        zoomToCity(cityName); // Zoom into the city
    }
}

// Function to zoom into the city on the map
function zoomToCity(cityName) {
    const coordinates = getCityCoordinates(cityName);
    if (coordinates) {
        map.setView(coordinates, 9);
    }
}

// Function to add a city marker on the map
function addCityMarker(cityName, color) {
    var coordinates = getCityCoordinates(cityName);

    if (!coordinates) {
        console.error(`City "${cityName}" not found or invalid coordinates.`);
        return;
    }

    var marker = L.circleMarker(coordinates, {
        radius: 6,
        color: color,
        fillColor: color,
        fillOpacity: 0.9
    }).bindPopup(cityName).addTo(cityMarkers);

    // Add click event to marker for city removal
    marker.on('click', function () {
        var popupContent = `
            <div style="text-align: center;">
                <strong>${cityName}</strong><br>
                <button onclick="removeCity('${cityName}', '${color}'); closePopup()"
                    style="background-color: red; color: white; border: none; padding: 5px 10px; margin-top: 5px; cursor: pointer;">
                    Remove City
                </button>
            </div>
        `;
        marker.bindPopup(popupContent).openPopup();
    });
}

// Function to remove a city from the visited or want-to-visit list
function removeCity(cityName, color) {
    if (visitedCities.includes(cityName)) {
        visitedCities = visitedCities.filter(c => c !== cityName);
    } else if (wantToVisitCities.includes(cityName)) {
        wantToVisitCities = wantToVisitCities.filter(c => c !== cityName);
    }
    cityMarkers.clearLayers();
    visitedCities.forEach(city => addCityMarker(city, '#ff9500'));
    wantToVisitCities.forEach(city => addCityMarker(city, '#5A00FF'));
    updateMap();
}




// Function to get or calculate centroid coordinates for a city
function getCityCoordinates(cityName) {
    if (cityCoordinates[cityName])  {
        return cityCoordinates[cityName];
    }
    
    const cityFeature = cities_geojson.features.find(feature => feature.properties.NAME === cityName);
    if (!cityFeature) {
        console.error(`City not found in GeoJSON: ${cityName}`);
        return null;
    }

    if (cityFeature.geometry.type === "Polygon") {
        const coordinates = cityFeature.geometry.coordinates[0];

        // Calculate centroid as the average of all points
        const centroid = coordinates.reduce((acc, coord) => {
            acc[0] += coord[0];
            acc[1] += coord[1];
            return acc;
        }, [0, 0]).map(total => total / coordinates.length); 

        cityCoordinates[cityName] = [centroid[1], centroid[0]];
        return cityCoordinates[cityName];
    }

    console.error("Unexpected geometry type:", cityFeature.geometry.type);
    return null;
}

// Update the map colors and markers
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

// --- Tab Functions ---
function showTab(tab) {
    document.getElementById('countries-tab').style.display = tab === 'countries' ? 'block' : 'none';
    document.getElementById('cities-tab').style.display = tab === 'cities' ? 'block' : 'none';
}

function showCountries() {
    document.getElementById('countriesTab').classList.add('active');
    document.getElementById('citiesTab').classList.remove('active');
    document.getElementById('countrySearchSection').classList.remove('hidden');
    document.getElementById('citySearchSection').classList.add('hidden');
}

function showCities() {
    document.getElementById('citiesTab').classList.add('active');
    document.getElementById('countriesTab').classList.remove('active');
    document.getElementById('citySearchSection').classList.remove('hidden');
    document.getElementById('countrySearchSection').classList.add('hidden');
}
