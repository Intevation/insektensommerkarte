import $ from 'jquery';
import mapboxgl from 'mapbox-gl';
import csv2geojson from 'csv2geojson';
import UIkit from 'uikit';
import randomColor from 'randomcolor';
import * as topojson from 'topojson-client';
import tauCharts from 'taucharts';
import tp from 'taucharts/dist/plugins/tooltip';

// https://css-tricks.com/css-modules-part-2-getting-started/
// https://medium.com/@rajaraodv/webpack-the-confusing-parts-58712f8fcad9#.txbwrns34
import '../node_modules/normalize.css/normalize.css'
import '../node_modules/taucharts/dist/taucharts.css';
import '../node_modules/mapbox-gl/dist/mapbox-gl.css';
import '../node_modules/uikit/dist/css/uikit.css';
import '../css/spinner.css';
import '../css/index.css';
import '../node_modules/taucharts/dist/plugins/tooltip.css';

// from uikit-icons.js
var info = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"> <path d="M12.13,11.59 C11.97,12.84 10.35,14.12 9.1,14.16 C6.17,14.2 9.89,9.46 8.74,8.37 C9.3,8.16 10.62,7.83 10.62,8.81 C10.62,9.63 10.12,10.55 9.88,11.32 C8.66,15.16 12.13,11.15 12.14,11.18 C12.16,11.21 12.16,11.35 12.13,11.59 C12.08,11.95 12.16,11.35 12.13,11.59 L12.13,11.59 Z M11.56,5.67 C11.56,6.67 9.36,7.15 9.36,6.03 C9.36,5 11.56,4.54 11.56,5.67 L11.56,5.67 Z"></path> <circle fill="none" stroke="#000" stroke-width="1.1" cx="10" cy="10" r="9"></circle></svg>';

$('#mySpinner').show();

// loads the Icon plugin
UIkit.icon.add({ info: info });
if ($(window).width() < 599) {
  $('.intro-sidebar').hide();
  $('#sidebar header').hide();
} else {
  $('.intro-sidebar').html('Hier können Sie sich verschiedene Meldungen und Beobachtungen anzeigen lassen, um interaktiv die Daten des <a href="https://www.nabu.de/tiere-und-pflanzen/aktionen-und-projekte/insektensommer/index.html" target=_blank>Insektensommers</a> zu erkunden.');
}

var outerHeight = $('#details').outerHeight(!0);
$('#details').css('bottom', 2 * -outerHeight);
$('#details-close').click(function() {
  $('#details').css('bottom', -outerHeight);
});

const tk25Template = require('../tmpl/details-tk25.html');
const fundTemplate = require('../tmpl/details-fund.html');
const meldungTemplate = require('../tmpl/details-meldung.html');
const bundeslandTemplate = require('../tmpl/details-bundesland.html');

var map = new mapboxgl.Map({
  container: 'map', // container id
  style: {
    glyphs: 'fonts/{fontstack}/{range}.pbf',
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        // point to our third-party tiles. Note that some examples
        // show a "url" property. This only applies to tilesets with
        // corresponding TileJSON (such as mapbox tiles).
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 18
      }
    ]
  },
  center: $(window).width() < 599 ? [10.0699, 51.4379] : [6.402, 51.638],
  zoom: $(window).width() < 599 ? 3.33 : 5.33,
  attributionControl: false
});

map.on('mousemove', function(ev) {
  map.queryRenderedFeatures(ev.point).length ? map.getCanvas().style.cursor = 'pointer' : map.getCanvas().style.cursor = ''
  // var features = map.queryRenderedFeatures(e.point);
  // document.getElementById('features').innerHTML = JSON.stringify(features[0].properties, null, 2);
});

// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

// map.addControl(new mapboxgl.NavigationControl(), 'top-right');
// TODO: Fix color of svg symbol and position.
// TODO: Fix of fade out of sidebar
map.addControl(new mapboxgl.FullscreenControl());
map.addControl(new mapboxgl.NavigationControl());
// Dirty hack for fullscreen control placement!
$('.mapboxgl-ctrl-fullscreen').appendTo('.mapboxgl-ctrl-group');
$('div.mapboxgl-ctrl-group:nth-child(1)').remove();
map.addControl(new mapboxgl.ScaleControl({
  maxWidth: 200,
  unit: 'metric'
}));

let layers = ['bundeslaender', 'meldungen', 'garten', 'balkon', 'park', 'wiese', 'wald', 'feld', 'teich', 'bachfluss', 'sonstiges', 'tk25']

function showPopup(template, props, chart) {
  $('#details').html(template(props));
  if (chart !== undefined) {
    chart.renderTo('#bar');
  }
  var outerHeight = $('#details').outerHeight(!0);
  $('#details').css('bottom', 2 * outerHeight);
  $('#details-close').click(function() {
    $('#details').css('bottom', -outerHeight);
  });
  $('#details').css('bottom', '60px');
  $(window).width() < 599
    ? $('#details').css('bottom', '0px')
    : $('#details').css('bottom', '60px');
}
function getWikiInfos(props) {
  var url = 'https://de.wikipedia.org/w/api.php';
  $.ajax({
    dataType: 'json',
    url: url,
    async: false,
    method: 'GET',
    headers: { 'Api-User-Agent': 'insektensommer.de/1.0' },
    // https://de.wikipedia.org/w/api.php
    data: {
      action: 'query',
      format: 'json',
      formatversion: 2,
      prop: 'extracts|pageimages|info|redirects|imageinfo',
      pithumbsize: 300,
      exintro: true,
      inprop: 'url',
      redirects: true,
      origin: '*',
      titles: props.gattung + ' ' + props.taxon
    },
    cache: true,
    success: function(data) {
      if (data.query) {
        props.wikititle = data.query.pages[0].title;
        if (data.query.pages[0].extract !== undefined) {
          props.beschreibung = data.query.pages[0].extract.trim();
        }
        if (data.query.pages[0].thumbnail !== undefined) {
          props.bild = data.query.pages[0].thumbnail.source;
          props.bilddatei = data.query.pages[0].pageimage;

          // https://commons.wikimedia.org/w/api.php?&action=query&prop=imageinfo&titles=File:Vespa_crabro_80708.jpg&format=json&iiprop=user|extmetadata
          $.ajax({
            dataType: 'json',
            url: url,
            async: false,
            method: 'GET',
            headers: { 'Api-User-Agent': 'insektensommer.de/1.0' },
            // https://de.wikipedia.org/w/api.php
            data: {
              action: 'query',
              format: 'json',
              prop: 'imageinfo',
              titles: 'File:' + data.query.pages[0].pageimage,
              iiprop: 'user|extmetadata',
              origin: '*'
            },
            cache: true,
            success: function(data) {
              props.bilduser = data.query.pages['-1'].imageinfo[0].user;
              props.bildname = data.query.pages['-1'].imageinfo[0].extmetadata.ObjectName.value;
              props.bildlizenz = data.query.pages['-1'].imageinfo[0].extmetadata.LicenseShortName.value;
              props.bildlizenzurl = data.query.pages['-1'].imageinfo[0].extmetadata.LicenseUrl.value;
            }
          });
        }
      }
    }
  });
  return props;
}

map.on('click', function(ev) {
  var features = map.queryRenderedFeatures(ev.point, {
    layers: layers
  });
  if (features.length) {
    let id = features[0].layer.id;
    let props = features[0].properties;
    if (id === 'tk25') {
      showPopup(tk25Template, props);
    } else if (id === 'meldungen') {
      var data = {
        anzahl: features.length,
        ppl: function() {
          return (this.anzahl === 1) ? 'Beobachtung' : 'Beobachtungen'
        },
        belongs: function() {
          return (this.anzahl === 1) ? 'gehört' : 'gehören'
        },
        meldung: []
      };
      for (const insect of features) {
        data.meldung.push({ 'artname': insect.properties.artname, 'anzahl': insect.properties.anzahl, 'lebensraum': insect.properties.lebensraum });
      }
      showPopup(meldungTemplate, data);
    } else if (id === 'bundeslaender') {
      // FIXME: Works only when layer funde is visible. But should also work when not. Strange.
      // var fs = map.querySourceFeatures('funde');
      var fs = map.getSource('funde')._data.features;
      var bltop5 = bundeslaenderTOP5(fs);
      var item = bltop5.find(
        function isCherries(item) {
          console.log(item.name);
          console.log(props);
          if (props.GEN === 'Sachsen-Anhalt') {
            return item.name === 'Sachsen-Anhalt';
          } else if (props.GEN === 'Sachsen') {
            return item.name === 'Sachsen';
          } else {
            return item.name.includes(props.GEN)
          }
        }
      );
      // var item = bltop5.find(item => props.GEN === "Sachsen-Anhalt" ? item.name.includes("Sachsen-Anhalt"): item.name.include(props.GEN));

      var chart = new tauCharts.Chart({
        plugins: [
          tp()
        ],
        guide: {
          x: {
            label: { text: 'Vogelart' }
          },
          y: {
            label: { text: 'Meldungen' }
          },
          showGridLines: 'xy'
        },
        data: item.top5,
        type: 'bar',
        x: 'artname',
        y: 'anzahl',
        color: 'artname'
      });
      showPopup(bundeslandTemplate, item, chart);
    } else {
      getWikiInfos(props);
      showPopup(fundTemplate, props);
    }
  } else {
    let oh = $('#details').outerHeight(!0);
    $('#details').css('bottom', -oh);
  }
});

function top100(features) {
  const unique = new Map();
  features.forEach(item => {
    const entry = unique.get(item.properties.artname);
    if (!entry) {
      unique.set(item.properties.artname, {
        artname: item.properties.artname,
        anzahl: 1
      });
    } else {
      ++entry.anzahl;
    }
  });
  const top100 = [...unique.values()];
  top100.sort(function(a, b) {
    return b.anzahl - a.anzahl;
  });
  let i = 0;
  for (let n of top100) {
    // die Sequence bei 100 abbrechen
    if (i < 100) {
      $('#top').append(
        '<div class="layer layer-legend ' +
                n.artname +
                '"> \
          <style>.circle.' +
                n.artname
                  .replace(/\((.*?)\)/g, '')
                  .replace(/\s?\/\s?/g, '')
                  .replace(/\s/g, '') +
                '::before{background: ' +
                randomColor() +
                ';}</style> \
            <div class="title"><span class="circle ' +
                n.artname
                  .replace(/\((.*?)\)/g, '')
                  .replace(/\s?\/\s?/g, '')
                  .replace(/\s/g, '') +
                '"> ' +
                n.artname +
                '</span></div>\
            <div class="switch">\
              <input type="checkbox" name="top100" id="' +
                n.artname +
                '" class="ios-toggle" unchecked />\
              <label for="' +
                n.artname +
                '" class="checkbox-label" data-off="aus" data-on="an" />\
            </div>\
          </div>'
      );
      i++;
    } else {
      break;
    }
  }
  $('input[name=top100]').change(function() {
    var id = $(this).attr('id');
    var elem1 = document.getElementsByClassName('circle ' + id.replace(/\((.*?)\)/g, '').replace(/\s?\/\s?/g, '').replace(/\s/g, ''));
    var style = window.getComputedStyle(elem1[0], ':before').getPropertyValue('background-color');
    if (map.getLayer(id) === undefined) {
      map.addLayer({
        id: id,
        source: 'funde',
        type: 'circle',
        layout: {
          visibility: 'none'
        },
        filter: ['==', 'artname', id],
        paint: {
          'circle-radius': 6,
          'circle-color': style,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1
        }
      });
      layers.push(id);
    }

    if ($(this).is(':checked')) {
      map.setLayoutProperty(id, 'visibility', 'visible');
    } else {
      map.setLayoutProperty(id, 'visibility', 'none');
    }
  });
}
function setAnzahlMeldungen(features) {
  var dummy = [];
  features.forEach(function(feat) {
    dummy.push([
      feat.geometry.coordinates[1],
      feat.geometry.coordinates[0]
    ]);
  });

  var anzahlMeldungen = dummy
    .map(JSON.stringify)
    .reverse()
    .filter(function(e, i, a) {
      return a.indexOf(e, i + 1) === -1;
    })
    .reverse()
    .map(JSON.parse);
  $('span.meldungen').text(
    ' Alle Meldungen (' + anzahlMeldungen.length + ')'
  );
}

function top5bundesland(features, bundesland) {
  const bl = features.filter(feature => feature.properties.bundesland === bundesland);
  const map = new Map();
  bl.forEach(item => {
    const entry = map.get(item.properties.artname);
    if (!entry) {
      map.set(item.properties.artname, { artname: item.properties.artname, anzahl: 1 });
    } else {
      ++entry.anzahl;
    }
  });
  const top = [...map.values()];
  top.sort(function(a, b) {
    return b.anzahl - a.anzahl;
  });
  let top5 = top.slice(0, 5);
  return top5;
}

function bundeslaenderTOP5(features) {
  var bl = [...new Set(features.map(feature => feature.properties.bundesland))];
  var t5 = []
  for (let l of bl) {
    t5.push({ name: l, top5: top5bundesland(features, l) })
  }
  return t5;
}

map.on('load', function() {
  $('#sidebar').css('left', '50px');
  $.ajax({
    url: 'data/beobachtungen.csv',
    method: 'GET',
    success: function(data) {
      makeGeoJSON(data);
      $('#mySpinner').hide();
    }
  });

  function makeGeoJSON(csvString) {
    csv2geojson.csv2geojson(
      csvString,
      function(err, data) {
        // err has any parsing errors
        // data is the data.
        if (err) {
          console.log(err);
        }
        top100(data.features);
        setAnzahlMeldungen(data.features);

        map.addSource('funde', { type: 'geojson', data: data });

        map.addLayer({
          id: 'meldungen',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'visible'
          },
          paint: {
            'circle-radius': 6,
            'circle-color': '#762a83',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });

        map.addLayer({
          id: 'garten',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', 'Garten'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#e31a1c',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });

        map.addLayer({
          id: 'balkon',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Balkon'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#fb9a99',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
        map.addLayer({
          id: 'park',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Park'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#fbdf6f',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
        map.addLayer({
          id: 'wiese',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Wiese'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#b2df8a',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
        map.addLayer({
          id: 'wald',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Wald'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#33a02c',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
        map.addLayer({
          id: 'feld',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Feld'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#ff7f00',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
        map.addLayer({
          id: 'teich',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Teich'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#a6cee3',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
        map.addLayer({
          id: 'bachfluss',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Bach/Fluss'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#1f78b4',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
        map.addLayer({
          id: 'sonstiges',
          source: 'funde',
          type: 'circle',
          layout: {
            visibility: 'none'
          },
          filter: ['==', 'lebensraum', ' Sonstiges'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#cab2d6',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          }
        });
      }
    );
  }

  $.ajax({
    dataType: 'json',
    url: 'data/vg2500_lan-p4.json',
    method: 'GET',
    success: function(data) {
      var features = topojson.feature(data, data.objects['vg2500_lan-p4']);

      map.addSource('bundeslaender_source', {
        type: 'geojson',
        data: features
      });

      map.addLayer({
        id: 'bundeslaender',
        source: 'bundeslaender_source',
        type: 'fill',
        layout: {
          visibility: 'none'
        },
        paint: {
          'fill-outline-color': '#037AFF',
          'fill-color': '#ffffff',
          'fill-opacity': 0.25
        }
      });
    }
  });

  map.addSource('tk25_source', {
    type: 'geojson',
    data: 'data/tk25.geojson'
  });

  map.addLayer({
    id: 'tk25',
    source: 'tk25_source',
    type: 'fill',
    layout: {
      visibility: 'none'
    },
    paint: {
      'fill-outline-color': '#037AFF',
      'fill-color': '#ffffff',
      'fill-opacity': 0.25
    }
  });

  map.addLayer({
    id: 'tk251',
    type: 'symbol',
    source: 'tk25_source',
    filter: ['in', '$type', 'LineString', 'Point', 'Polygon'],
    layout: {
      visibility: 'none',
      'text-field': [
        'step',
        ['zoom'],
        ['to-string', null],
        8,
        ['to-string', ['get', 'TKnr']],
        9,
        ['concat', ['to-string', ['get', 'Name']], ' \n', ['get', 'TKnr']],
        12,
        ['to-string', null]
      ],
      'text-max-width': 4,
      'text-padding': 5,
      'text-size': 16,
      'text-font': ['Open Sans Regular'],
      'symbol-avoid-edges': true
    },
    paint: {
      'text-translate-anchor': 'viewport'
    }
  });

  map.addLayer({
    'id': 'satellite',
    'type': 'raster',
    'source': {
      'type': 'raster',
      'tiles': [
        'https://tiles.maps.eox.at/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&layers=s2cloudless_3857'
      ],
      'tileSize': 256
    },
    'layout': {
      'visibility': 'none'
    },
    'paint': {},
    'minzoom': 0,
    'maxzoom': 14
  }, 'tk25');

  map.addLayer({
    'id': 'stamen',
    'type': 'raster',
    'source': {
      'type': 'raster',
      'tiles': [
        'https://stamen-tiles-a.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
        'https://stamen-tiles-b.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
        'https://stamen-tiles-c.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
        'https://stamen-tiles-d.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
      ],
      'tileSize': 256
    },
    'layout': {
      'visibility': 'none'
    },
    'paint': {},
    'minzoom': 0,
    'maxzoom': 14
  }, 'tk25');
});

$('input[name=insektensommer]').change(function() {
  var id = $(this).attr('id');
  if ($(this).is(':checked')) {
    map.setLayoutProperty(id, 'visibility', 'visible');
  } else {
    map.setLayoutProperty(id, 'visibility', 'none');
  }
});

$('input[name=bundeslaender]').change(function() {
  if ($(this).is(':checked')) {
    map.setLayoutProperty('bundeslaender', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('bundeslaender', 'visibility', 'none');
  }
});

$('input[name=messtischblatt]').change(function() {
  if ($(this).is(':checked')) {
    map.setLayoutProperty('tk25', 'visibility', 'visible');
    map.setLayoutProperty('tk251', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('tk25', 'visibility', 'none');
    map.setLayoutProperty('tk251', 'visibility', 'visible');
  }
});

$('input[name=baselayer]').change(function() {
  // Uncheck other checkboxes
  $('input[name=baselayer]').not(this).prop('checked', false);
  // Deal with actual checkbox
  var id = $(this).attr('id');
  if ($(this).is(':checked')) {
    map.setLayoutProperty(id, 'visibility', 'visible');
    if (id === 'osm') {
      map.setLayoutProperty('satellite', 'visibility', 'none');
      map.setLayoutProperty('stamen', 'visibility', 'none');
    } else if (id === 'satellite') {
      map.setLayoutProperty('osm', 'visibility', 'none');
      map.setLayoutProperty('stamen', 'visibility', 'none');
    } else {
      map.setLayoutProperty('osm', 'visibility', 'none');
      map.setLayoutProperty('satellite', 'visibility', 'none');
    }
  } else {
    map.setLayoutProperty(id, 'visibility', 'none');
  }
});

$('input[name=lebensraum]').change(function() {
  // TODO: Fixed input handling.
  // map.setLayoutProperty('meldungen', 'visibility', 'none');
  // $('#meldungen').attr('checked', false);
  var id = $(this).attr('id');
  if ($(this).is(':checked')) {
    map.setLayoutProperty(id, 'visibility', 'visible');
  } else {
    map.setLayoutProperty(id, 'visibility', 'none');
  }
});
