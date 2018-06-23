var API_HOST="http://localhost:5000";
var TILE_HOST="http://localhost:8001";
var name="person";

var ALL=false;
mapboxgl.accessToken = 'MAPBOX API KEY';
var center = [15.611572,46.566414,14];
center = [center[0], center[1]];


var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: center,
    zoom: 11.15
});
var layerIDs = []; // Will contain a list used to filter against.

var bicycle_types = ["", "Lezecko", "Gorsko", "Cestno", "Kolo"];

var GuiConfig = function() {
    this.person = 'Marko';
    this.bicycle = 'Lezecko';
    this.relative_time_a = 50;
};

function filterBy(relative_time, bicycle_type) {
    var filters = ['<', 'relative_time_a', relative_time*60];
    if (bicycle_type.length > 1) {
        filters = ["all", filters, ["==", "bicycle", bicycle_type]];
    }
    map.setFilter('track_line', filters);
}
function renderProperties(feature) {
  var sourceProperty = renderLayer(feature.layer['source-layer'] || feature.layer.source);
  var typeProperty = renderProperty('$type', feature.geometry.type);
  var properties = [];
  /*Object.keys(feature.properties).filter(function (propertyName) {*/
  /*return propertyName != "tour_description";*/
  /*})*/
  /*.map(function (propertyName) {*/
  /*return renderProperty(propertyName, feature.properties[propertyName]);*/
  /*});*/
  properties.push(renderProperty("tour_title", feature.properties["tour_title"]))
  properties.push(renderProperty("track_info_id", feature.properties["track_info_id"]))
  properties.push(renderProperty("bicycle", feature.properties["bicycle"]))
  
  return [sourceProperty, typeProperty].concat(properties).join('');
}

var AddControl;

var guiConfig = new GuiConfig();
var gui = new dat.GUI();
gui.remember(guiConfig);
var bicycle_controller=gui.add(guiConfig, 'bicycle', bicycle_types);
var relContr = gui.add(guiConfig, "relative_time_a", 0, 9*60); // 4000/60);

//TODO: color based on distance/time 

//Categorical styling example: https://jsfiddle.net/8vnsbpqf/5/

//https://www.mapbox.com/mapbox-gl-js/example/timeline-animation/
var layerID = "track_line";
map.on('load', function() {
    map.addSource('tracks', {
        type: 'vector',
        tiles: [
            'http://localhost:8001/tiles/tracks/{z}/{x}/{y}.pbf'
        ],
        maxzoom: 14
    });
    console.log("ADDED track_line");
    map.addLayer({
        'id': layerID,
        'type': 'line',
        'source': 'tracks',
        'source-layer': 'track_lines',
        /*'source-layer': 'all_tracks',*/
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': {
                'property': "distance_a",
                'type': 'exponential',
                "stops":[
                    [0, '#000000'],
                    [10000, '#ffff00'],
                    [100000, '#ff0000'],
                    [140000, '#6a0000']
                ],
                'colorSpace':"lab"
            },
            'line-width': 1,
            'line-opacity': 0.75
        }
    });
        map.addLayer({
            'id': 'selected-track',
            'type': 'line',
            'source': 'tracks',
            'source-layer': 'track_lines',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': 'none'
            },
            'paint': {
                'line-color': "#ff0000",
                'line-width': 2,
                'line-opacity': 0.75
            }
        });
    map.on('click', function(e) {
        // set a bbox around the pointer
        var selectThreshold = 3;
        var queryBox = [
            [
            e.point.x - selectThreshold,
            e.point.y + selectThreshold
        ], // bottom left (SW)
        [
            e.point.x + selectThreshold,
            e.point.y - selectThreshold
        ] // top right (NE)
        ];
        var features = map.queryRenderedFeatures(queryBox, {
            layers: [layerID]
        }) || [];
        /*map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';*/
        if (features.length) {

            var feature_ids = []

	    var onlyUnique = function(value, index, self) {
		return self.map(mapObj => mapObj["properties"]["track_info_id"]).indexOf(value["properties"]["track_info_id"]) === index;
	    };
            var filtered_features = features.filter( onlyUnique );

            var selIds = filtered_features.map(function(feature) { return ["==", "track_info_id", feature.properties.track_info_id];});
            map.setFilter("selected-track", ["all", ['<', 'relative_time_a', guiConfig.relative_time_a*60], ["any"].concat(selIds)]);
            map.setLayoutProperty("selected-track", 'visibility', 'visible');

            new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(renderPopup(filtered_features))
            .addTo(map)
            .on('close', function(p) {
                map.setLayoutProperty("selected-track", 'visibility', 'none');
            });


        }
    });

	// Change the cursor to a pointer when the mouse is over the places layer.
	map.on('mouseenter', function () {
	    map.getCanvas().style.cursor = 'pointer';
	});

	// Change it back to a pointer when it leaves.
	map.on('mouseleave', function () {
	    map.getCanvas().style.cursor = '';
	});

    relContr.onFinishChange(function(value) {
        filterBy(value, guiConfig.bicycle);

    });
    bicycle_controller.onChange(function(value) {
        filterBy(guiConfig.relative_time_a, value);
    });
    /*filterBy(50);*/
});

