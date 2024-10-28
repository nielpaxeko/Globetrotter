 // Center the map on the world
var map = L.map('map').setView([20, 0], 2);
var visitedCountries = [];
var wantToVisitCountries = [];
var countryLayer = null;

// Load GeoJSON data
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

// Function to handle country clicks
function handleCountryClick(countryName) {
    // CASE 1: Remove from Visited list
    if (visitedCountries.includes(countryName)) {
        if (confirm(`Remove ${countryName} from the visited list?`)) {
            visitedCountries = visitedCountries.filter(c => c !== countryName);
        }
    } else if (wantToVisitCountries.includes(countryName)) { // CASE 2: Remove from Want to Visit list
        if (confirm(`Remove ${countryName} from the want to visit list?`)) {
            wantToVisitCountries = wantToVisitCountries.filter(c => c !== countryName);
        }
    } else {
        // CASE 3: Prompt user to add to a list
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
        // Display the pop-up at the country location on the map
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

// Function to update the map colors based on current lists
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

            // Update each country's color based on its list
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
        })
        .catch(err => console.error('Error:', err));
}

// Fetch country names for autocomplete
fetch('/countries')
    .then(response => response.json())
    .then(countryList => {
        populateAutocomplete(countryList);
    });
