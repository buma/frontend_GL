var API_HOST="http://localhost:5000";
var TILE_HOST="http://localhost:8001";
var name="person";

var ALL=false;
mapboxgl.accessToken = 'MAPBOX API KEY';
var center = [15.611572,46.566414,14];
center = [center[0], center[1]];


var map = new mapboxgl.Map({
    container: 'map',
    /*style: 'mapbox://styles/mapbox/light-v9',*/
    style: 'mapbox://styles/mapbox/outdoors-v9',
    center: center,
    zoom: 11.15
});
var layerIDs = []; // Will contain a list used to filter against.

var bicycle_types = ["", "Lezecko", "Gorsko", "Cestno", "Kolo"];

var GuiConfig = function() {
    this.person = 'Marko';
    this.bicycle = 'Lezecko';
    this.max_distance = 40;
    this.min_distance = 10;
    this.driving_duration = 5;
    this.recording_duration = 4;
};


var guiConfig = new GuiConfig();
var gui = new dat.GUI();
gui.remember(guiConfig);
var bicycle_controller=gui.add(guiConfig, 'bicycle', bicycle_types);
var max_distance_controller=gui.add(guiConfig, 'max_distance', 0, 150);
var min_distance_controller=gui.add(guiConfig, 'min_distance', 0, 150);

function makeFilter() {
    var filter = ["all"]
    filter.push(["==", "person", guiConfig.person]);
    if (guiConfig.bicycle.length > 1) {
        filter.push(["==", "bicycle", guiConfig.bicycle]);
    }
    filter.push(["<", "distance", guiConfig.max_distance*1000]);
    filter.push([">=", "distance", guiConfig.min_distance*1000]);
    console.log("Filter:", filter);
    return filter;

}

function updateValue(value) {
    var filters = makeFilter();
    map.setFilter('all-tracks', filters);
}

min_distance_controller.onChange(updateValue);
max_distance_controller.onChange(updateValue);
bicycle_controller.onChange(updateValue);

function displayValue(value) {
  if (typeof value === 'undefined' || value === null) return value;
  if (typeof value === 'object' ||
      typeof value === 'number' ||
      typeof value === 'string') return value.toString();
  return value;
}
function renderProperty(propertyName, property) {
  return '<div class="mbview_property">' +
    '<div class="mbview_property-name">' + propertyName + '</div>' +
    '<div class="mbview_property-value">' + displayValue(property) + '</div>' +
    '</div>';
}
function renderLayer(layerId) {
  return '<div class="mbview_layer">' + layerId + '</div>';
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
  properties.push(renderProperty("info", "Driven: " + feature.properties["driven"] + " " + feature.properties["bicycle"] + " " + feature.properties["person"]))
  properties.push(renderProperty("date", "created:" + feature.properties["date_created"] + "mod:"+feature.properties["date_modified"]))
  properties.push(renderProperty("distance", feature.properties["distance"]/1000+"km"))
  properties.push(renderProperty("max_speed", feature.properties["max_speed"].toFixed(2)+"km/h"))
  /*properties.push(renderProperty("max_altitude", feature.properties["max_altitude"].toFixed(2)+"m"))*/
  properties.push(renderProperty("altitude", "up: " + feature.properties["tour_altitude_up"].toFixed(2)+"m" + " down: " + feature.properties["tour_altitude_down"].toFixed(2)+"m max: " + feature.properties["max_altitude"].toFixed(2)+"m"))
  properties.push(renderProperty("duration", "driving:" + feature.properties["tour_driving_time"] + " rec:"+feature.properties["tour_recording_time"]))
  properties.push(renderProperty("time", feature.properties["tour_start_time"] + " - "+feature.properties["tour_end_time"]))
  
  return [sourceProperty, typeProperty].concat(properties).join('');
}
function renderFeatures(features) {
  return features.map(function (ft) {
    return '<div class="mbview_feature">' + renderProperties(ft) + '</div>';
  }).join('');
}
function renderPopup(features) {
  return '<div class="mbview_popup">' + renderFeatures(features) + '</div>';
}

//Categorical styling example: https://jsfiddle.net/8vnsbpqf/5/

function updateData(data) {
    console.log("DATA:", data);
    map.on('load', function() {
	map.addSource('tracks', {
		type: 'vector',
		tiles: [
			'http://localhost:8001/tiles/tracks/{z}/{x}/{y}.pbf'
		],
		maxzoom: 14
	});
        var controller=gui.add(guiConfig, 'person', data);
        var layerID = 'all-tracks';
        if (!map.getLayer(layerID)) {
            map.addLayer({
                'id': layerID,
                'type': 'line',
                'source': 'tracks',
                'source-layer': 'all_tracks',
                'filter': makeFilter(), // ["==", "person", person],
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': {
                        property: 'bicycle',
                        type: 'categorical',
                        stops: [
                            ['Lezecko', "#568203"],
                            ['Gorsko', "#ffa500"],
                            ['Cestno', "#ffff00"],
                            ['Kolo', "#808080"]
                        ]
                    },
                    'line-width': 2,
                    'line-opacity': 0.75
                }
            });
            layerIDs.push(layerID);
        }
        map.addLayer({
            'id': 'selected-track',
            'type': 'line',
            'source': 'tracks',
            'source-layer': 'all_tracks',
            'filter': makeFilter(), // ["==", "person", person],
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
		layers: layerIDs
	    }) || [];
	    /*map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';*/
	    if (features.length) {

            var selIds = features.map(function(feature) { return ["==", "track_info_id", feature.properties.track_info_id];});
            map.setFilter("selected-track", ["any"].concat(selIds));
            map.setLayoutProperty("selected-track", 'visibility', 'visible');

            new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(renderPopup(features))
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
        controller.onFinishChange(updateValue);
    });
}


updateData(["Marko", "Noben", "Uradna_pot"]);



/*
fetch(API_HOST+"/api/tracks/types/" + name)
.then((resp) => resp.json())
.then(function(data) {
    updateData(data);
})
.catch(function(error) {
    console.error(error);
});
*/
