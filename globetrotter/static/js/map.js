var map = L.map('map').setView([20, 0], 2); // Center the map on the world
var visitedCountries = [];
var wantToVisitCountries = [];
var countryLayer = null;

// Load GeoJSON data for all countries
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
                layer.on('click', function () {
                    countryName = feature.properties.ADMIN;
                    if (visitedCountries.includes(countryName)) {
                        if (confirm(`Do you want to remove ${feature.properties.ADMIN} from your visited list?`)) {
                            visitedCountries = visitedCountries.pop(countryName);
                        }

                    } else if (wantToVisitCountries.includes(countryName)) {
                        if (confirm(`Do you want to remove ${feature.properties.ADMIN} from your want to visit list?`)) {
                            wantToVisitCountries = wantToVisitCountries.pop(countryName);
                        }
                    }
                    
                    else {
                        if (confirm(`Do you want to add ${feature.properties.ADMIN} to your visited list?`)) {
                            visitedCountries.push(countryName);
                        }
                    }
                    updateMap();

                });
            }
        }).addTo(map);
        var countryList = data.features.map(feature => feature.properties.ADMIN);
        populateAutocomplete(countryList);
    });

// Function to populate the autocomplete list with countries
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

// Function to add country to visited or want-to-visit list
function addCountry(status) {
    var countryName = document.getElementById('countrySearch').value;
    if (!countryName) return alert('Please enter a country name');

    // Determine if the country is already in one of the lists
    const isVisited = visitedCountries.includes(countryName);
    const isWantToVisit = wantToVisitCountries.includes(countryName);

    if (isVisited && status === 'visited') {
        visitedCountries = visitedCountries.pop(countryName);
    } else if (isWantToVisit && status === 'want_to_visit') {
        wantToVisitCountries = wantToVisitCountries.filter.pop(countryName);
    }
    if (status === 'visited') {
        if (isWantToVisit) {
            wantToVisitCountries = wantToVisitCountries.pop(countryName);
        }
        visitedCountries.push(countryName);
    } else if (status === 'want_to_visit') {
        if (isVisited) {
            visitedCountries = visitedCountries.pop(countryName);
        }
        wantToVisitCountries.push(countryName);
    }
    updateMap();



}

// Function to update the the map
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

            countryLayer.eachLayer(function (layer) {
                var countryName = layer.feature.properties.ADMIN;  // Get country name from GeoJSON
                if (visitedCountries.includes(countryName)) {
                    layer.setStyle({ color: 'orange', fillOpacity: 0.5 });
                } else if (wantToVisitCountries.includes(countryName)) {
                    layer.setStyle({ color: 'purple', fillOpacity: 0.5 });
                } else {
                    layer.setStyle({ color: '#3388ff', fillOpacity: 0.2 }); // Reset to default color
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
