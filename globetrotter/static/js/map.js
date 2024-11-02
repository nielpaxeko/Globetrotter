// --- Map Setup ---
var map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

const railwayLayer = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
document.getElementById('toggleRailwayLayer').addEventListener('change', function (event) {
    if (event.target.checked) {
        map.addLayer(railwayLayer);
    } else {
        map.removeLayer(railwayLayer);
    }
});

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


// Map Pin Icons
var visitedIcon = new L.Icon({
    iconUrl: '/static/js/visited-pin.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});
var wantedIcon = new L.Icon({
    iconUrl: '/static/js/wanted-pin.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});
var currentIcon = new L.Icon({
    iconUrl: '/static/js/current-pin.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});



// --- Load Data ---
fetch('/static/js/cities.geojson')
    .then(response => response.json())
    .then(data => {
        cities_geojson = data;
        validCities = data.features.map(feature => feature.properties.NAME);
        populateCityAutocomplete(validCities);
    });

fetch('/static/js/countries.geojson')
    .then(response => response.json())
    .then(data => {
        countryLayer = L.geoJSON(data, {
            style: {
                weight: 1,
                fillOpacity: 0.2
            },
            onEachFeature: function (feature, layer) {
                const countryName = feature.properties.ADMIN;

                // Click event for each country
                layer.on('click', function (event) {
                    handleCountryClick(countryName, event);
                });
            }
        }).addTo(map);
        // Autocomplete
        var countryList = data.features.map(feature => feature.properties.ADMIN);
        populateAutocomplete(countryList);
    });

// --- Country Logic ---
function handleCountryClick(countryName, event) {
    // Get the lat and lon of the click event
    const clickLocation = event.latlng;

    if (visitedCountries.includes(countryName)) {
        if (confirm(`Remove ${countryName} from the visited list?`)) {
            visitedCountries = visitedCountries.filter(c => c !== countryName);
            updateCountry(countryName);
        }
    } else if (wantToVisitCountries.includes(countryName)) {
        if (confirm(`Remove ${countryName} from the want to visit list?`)) {
            wantToVisitCountries = wantToVisitCountries.filter(c => c !== countryName);
            updateCountry(countryName);
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
        L.popup()
            .setLatLng(clickLocation)
            .setContent(popupContent)
            .openOn(map);
    }
    updateMap();
}


function closePopup() {
    map.closePopup();
    updateMap();
}

// Function to update the style of a country based on its visit status
function updateCountry(countryName) {
    countryLayer.eachLayer(function (layer) {
        var currentCountryName = layer.feature.properties.ADMIN;
        if (currentCountryName === countryName) {
            layer.setStyle({
                color: '#3388ff',
                fillOpacity: 0.2
            });
        }
    });
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
    zoomToCountry(countryName);
    addCountryToList(countryName, status);
    updateMap();
}

// Add country to visited or want-to-visit list
function addCountryToList(countryName, status) {
    visitedCountries = visitedCountries.filter(c => c !== countryName);
    wantToVisitCountries = wantToVisitCountries.filter(c => c !== countryName);

    if (status === 'visited') {
        visitedCountries.push(countryName);
        updateVisitedCounts();
    } else if (status === 'want_to_visit') {
        wantToVisitCountries.push(countryName);
    }
}

// Function to zoom into a country 
function zoomToCountry(countryName) {
    countryLayer.eachLayer(function (layer) {
        if (layer.feature.properties.ADMIN === countryName) {
            map.flyToBounds(layer.getBounds(), 2, { duration: 1 });
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
        return alert(cityName + "was not found.");
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
        zoomToCity(cityName);
        addCityMarker(cityName, visitedIcon);
        updateVisitedCounts();
    } else if (status === 'want_to_visit') {
        wantToVisitCities.push(cityName);
        zoomToCity(cityName);
        addCityMarker(cityName, wantedIcon);
    }
}

// Function to zoom into the city on the map with animation
function zoomToCity(cityName) {
    const coordinates = getCityCoordinates(cityName);
    if (coordinates) {
        map.flyTo(coordinates, 5, { duration: .5 });
    }
}

// Function to update the display of visited counts
function updateVisitedCounts() {
    const countryCount = visitedCountries.length;
    document.getElementById('countryCount').textContent = countryCount;
    document.getElementById('countriesVisited').style.display = countryCount > 0 ? 'block' : 'none';

    const cityCount = visitedCities.length;
    document.getElementById('cityCount').textContent = cityCount;
    document.getElementById('citiesVisited').style.display = cityCount > 0 ? 'block' : 'none';
}

// Function to add a city marker on the map
function addCityMarker(cityName, icon) {
    var coordinates = getCityCoordinates(cityName);

    if (!coordinates) {
        console.error(`City "${cityName}" not found or invalid coordinates.`);
        return;
    }

    var marker = L.marker(coordinates, { icon: icon }).addTo(cityMarkers);
    cityMarkers[cityName] = marker;

    // Remove city click event
    marker.on('click', function () {
        var popupContent = `
            <div style="text-align: center;">
                <strong>${cityName}</strong><br>
                <button onclick="removeCity('${cityName}'); closePopup();"
                    style="background-color: red; color: white; border: none; padding: 5px 10px; margin-top: 5px; cursor: pointer;">
                    Remove City
                </button>
            </div>
        `;
        marker.bindPopup(popupContent).openPopup();
    });
}


// Remove city from lists
function removeCity(cityName) {
    visitedCities = visitedCities.filter(c => c !== cityName);
    wantToVisitCities = wantToVisitCities.filter(c => c !== cityName);

    var marker = cityMarkers[cityName];
    if (marker) {
        cityMarkers.removeLayer(marker);
        delete cityMarkers[cityName];
    }
    updateMap();
}



// Calculate centroid coordinates for a city
function getCityCoordinates(cityName) {
    if (cityCoordinates[cityName]) {
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
                }
            });

            // Clear and re-add city markers
            cityMarkers.clearLayers();
            visitedCities.forEach(city => addCityMarker(city, visitedIcon));
            wantToVisitCities.forEach(city => addCityMarker(city, wantedIcon));
            updateVisitedCounts();
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

// --- User Geolocation ---
function locateUser() {
    const permission = confirm("Would you like to share your location?");
    if (permission) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    const userLocation = [latitude, longitude];
                    map.setView(userLocation, 5);

                    // Add a marker for user's location
                    const userMarker = L.marker(userLocation, {
                        title: "Your Location",
                        icon: currentIcon
                    }).addTo(map).bindPopup("You are here!");
                    const countryName = getCountryFromLayer(userLocation);
                    if (countryName) {
                        console.log(`User's current country: ${countryName}`);
                        if (!visitedCountries.includes(countryName)) {
                            visitedCountries.push(countryName);
                            console.log(`Added country: ${countryName} to visited list.`);
                            // Refresh the map
                            updateMap();
                            updateVisitedCounts();
                        } else {
                            console.log(`Country ${countryName} is already in visited list.`);
                        }
                    } else {
                        console.error("No country found for the user's location.");
                    }
                },
                error => console.error("Geolocation error:", error)
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

}

// Function to find the country in `countryLayer` based on given coordinates
function getCountryFromLayer(coords) {
    if (!countryLayer) {
        console.error("Country layer is not initialized yet.");
        return null;
    }
    let countryName = null;
    countryLayer.eachLayer(layer => {
        if (layer.getBounds().contains(coords)) {
            countryName = layer.feature.properties.ADMIN;
        }
    });
    return countryName;
}

document.getElementById('locateUserButton').addEventListener('click', locateUser);

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




