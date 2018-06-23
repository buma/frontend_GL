var API_HOST="http://localhost:5000";
var TILE_HOST="http://localhost:8001";
var name="person";

var ALL=false;
mapboxgl.accessToken = 'MAPBOX API KEY';
var center = [15.611572,46.566414,14];
center = [center[0], center[1]];


var map = new mapboxgl.Map({
    container: 'map',
    /*style: 'mapbox://styles/mapbox/dark-v9',*/
    style: 'mapbox://styles/mapbox/outdoors-v9',
    center: center,
    zoom: 11.15
});
var layerIDs = []; // Will contain a list used to filter against.

var GuiConfig = function() {
    this.person = 'Marko';
    this.relative_time_a = "unpaved";
};

function filterBy(relative_time) {
    var filters = ['==', 'surface', relative_time];
    if (relative_time == "ALL") {
        //Clears filter
        map.setFilter(null);
    } else {
        map.setFilter('track_line', filters);
    }
}

var AddControl;

var guiConfig = new GuiConfig();
var gui = new dat.GUI();
gui.remember(guiConfig);
var relContr = gui.add(guiConfig, "relative_time_a", "unpaved"); // 4000/60);

//TODO: color based on distance/time 

//Categorical styling example: https://jsfiddle.net/8vnsbpqf/5/

//https://www.mapbox.com/mapbox-gl-js/example/timeline-animation/
var layerID = "track_line";
map.on('load', function() {
    map.addSource('tracks', {
        type: 'vector',
        tiles: [
            'http://localhost:8001/tiles/unpaved/{z}/{x}/{y}.pbf'
        ],
        maxzoom: 14
    });
    console.log("ADDED track_line");
    map.addLayer({
        'id': layerID,
        'type': 'line',
        'source': 'tracks',
        'source-layer': 'unpaved',
        /*'source-layer': 'all_tracks',*/
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': "#00ff35",
            'line-width': 2,
            'line-opacity': 0.75
        }
    });

    relContr.onFinishChange(function(value) {
        filterBy(value);

    });
    /*filterBy(50);*/
});

