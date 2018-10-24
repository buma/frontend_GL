/*jshint esversion: 6 */
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
function renderFeatures(features) {
  return features.map(function (ft) {
    return '<div class="mbview_feature">' + renderProperties(ft) + '</div>';
  }).join('');
}
export function renderPopup(features) {
  return '<div class="mbview_popup">' + renderFeatures(features) + '</div>';
}
