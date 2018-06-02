import $ from 'jquery';
import mapboxgl from 'mapbox-gl';
import UIkit from 'uikit';
import GeoJSON from 'geojson';
import gp from 'geojson-precision';

// https://css-tricks.com/css-modules-part-2-getting-started/
// https://medium.com/@rajaraodv/webpack-the-confusing-parts-58712f8fcad9#.txbwrns34
import '../node_modules/normalize.css/normalize.css'
import '../node_modules/mapbox-gl/dist/mapbox-gl.css';
import '../node_modules/uikit/dist/css/uikit.css';
import '../css/index.css';

// from uikit-icons.js
var info = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"> <path d="M12.13,11.59 C11.97,12.84 10.35,14.12 9.1,14.16 C6.17,14.2 9.89,9.46 8.74,8.37 C9.3,8.16 10.62,7.83 10.62,8.81 C10.62,9.63 10.12,10.55 9.88,11.32 C8.66,15.16 12.13,11.15 12.14,11.18 C12.16,11.21 12.16,11.35 12.13,11.59 C12.08,11.95 12.16,11.35 12.13,11.59 L12.13,11.59 Z M11.56,5.67 C11.56,6.67 9.36,7.15 9.36,6.03 C9.36,5 11.56,4.54 11.56,5.67 L11.56,5.67 Z"></path> <circle fill="none" stroke="#000" stroke-width="1.1" cx="10" cy="10" r="9"></circle></svg>';

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

// const nabu = { modul: 'beobachtungenNABU', email1: 'NabuREST@naturgucker.de', md5: '202cb962ac59075b964b07152d234b70', offset: 0, service: -1582992474 };

const insektenSommer = {
  modul: 'beobachtungenNABU',
  email1: 'NabuRESTInsektensommer@naturgucker.de',
  md5: '202cb962ac59075b964b07152d234b70',
  offset: 0,
  zeilen: 0,
  service: 1628986788
};

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

let layers = ['meldungen', 'insekten', 'garten', 'balkon', 'park', 'wiese', 'wald', 'feld', 'teich', 'bachfluss', 'sonstiges', 'tk25']

map.on('click', function(ev) {
  var features = map.queryRenderedFeatures(ev.point, {
    layers: layers
  });
  if (features.length) {
    let id = features[0].layer.id;
    let props = features[0].properties;
    if (id === 'tk25') {
      $('#details').html(tk25Template(props));
      var outerHeightTK25 = $('#details').outerHeight(!0);
      $('#details').css('bottom', 2 * outerHeightTK25);
      $('#details-close').click(function() {
        $('#details').css('bottom', -outerHeightTK25);
      });
      $('#details').css('bottom', '60px');
      $(window).width() < 599
        ? $('#details').css('bottom', '0px')
        : $('#details').css('bottom', '60px');
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
      $('#details').html(meldungTemplate(data));
      var outerHeightMeldung = $('#details').outerHeight(!0);
      $('#details').css('bottom', 2 * outerHeightMeldung);
      $('#details-close').click(function() {
        $('#details').css('bottom', -outerHeightMeldung);
      });
      $('#details').css('bottom', '60px');
      $(window).width() < 599
        ? $('#details').css('bottom', '0px')
        : $('#details').css('bottom', '60px');
    } else {
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
            $('#details').html(fundTemplate(props));
            var outerHeightFund = $('#details').outerHeight(!0);
            $('#details').css('bottom', 2 * -outerHeightFund);
            $(window).width() < 599
              ? $('#details').css('bottom', '0px')
              : $('#details').css('bottom', '60px');
            $('#details-close').click(function() {
              $('#details').css('bottom', 2 * -outerHeightFund);
            });
          }
        }
      });
    }
  } else {
    let oh = $('#details').outerHeight(!0);
    $('#details').css('bottom', -oh);
  }
});

map.on('load', function() {
  $('#sidebar').css('left', '50px');
  $.ajax({
    dataType: 'json',
    url: 'https://naturgucker.de/mobil/?callback=?',
    method: 'GET',
    data: insektenSommer,
    success: function(data) {
      const map = new Map();
      data.beobachtungen.forEach(item => {
        const entry = map.get(item.artname);
        if (!entry) {
          map.set(item.artname, { artname: item.artname, anzahl: 1 });
        } else {
          ++entry.anzahl;
        }
      });
      const top100 = [...map.values()];
      top100.sort(function(a, b) {
        return b.anzahl - a.anzahl;
      });
      let i = 0;
      for (let n of top100) {
        // die Sequence bei 100 abbrechen
        if (i < 100) {
          $('#top').append('<div class="layer layer-legend ' + n.artname + '"> \
            <div class="title">' + n.artname + '</div>\
            <div class="switch">\
              <input type="checkbox" name="top100" id="' + n.artname + '" class="ios-toggle" unchecked />\
              <label for="' + n.artname + '" class="checkbox-label" data-off="aus" data-on="an" />\
            </div>\
          </div>');
          i++;
        } else {
          break;
        }
      }
      makeGeoJSON(data);
    }
  });

  function makeGeoJSON(data) {
    var geojson = GeoJSON.parse(data.beobachtungen, {
      Point: ['lat', 'lng']
    });
    var trimmed = gp(JSON.parse(JSON.stringify(geojson).replace(/"\s+|\s+"/g, '"')), 6);

    var dummy = [];
    trimmed.features.forEach(function(feat) {
      dummy.push([
        feat.geometry.coordinates[1],
        feat.geometry.coordinates[0]
      ]);
    });

    var anzahlMeldungen = dummy.map(JSON.stringify).reverse().filter(function(e, i, a) { return a.indexOf(e, i + 1) === -1; }).reverse().map(JSON.parse);
    $('span.meldungen').text(' Alle Meldungen (' + anzahlMeldungen.length + ')');

    map.addSource('funde', { type: 'geojson', data: trimmed });

    $('input[name=top100]').change(function() {
      var id = $(this).attr('id');
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
            'circle-color': '#e31a1c',
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
      id: 'insekten',
      source: 'funde',
      type: 'circle',
      layout: {
        visibility: 'none'
      },
      paint: {
        'circle-radius': 6,
        'circle-color': '#000000',
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
      filter: ['==', 'lebensraum', 'Balkon'],
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
      filter: ['==', 'lebensraum', 'Park'],
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
      filter: ['==', 'lebensraum', 'Wiese'],
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
      filter: ['==', 'lebensraum', 'Wald'],
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
      filter: ['==', 'lebensraum', 'Feld'],
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
      filter: ['==', 'lebensraum', 'Teich'],
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
      filter: ['==', 'lebensraum', 'Bach/Fluss'],
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
      filter: ['==', 'lebensraum', 'Sonstiges'],
      paint: {
        'circle-radius': 6,
        'circle-color': '#cab2d6',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1
      }
    });
  }

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

// $('.tk25.layer-legend').change(function() {
//  $(this).next().toggleClass('active');
//  $(this).next().slideToggle('slow')
// });
//

$('input[name=insektensommer]').change(function() {
  var id = $(this).attr('id');
  if ($(this).is(':checked')) {
    map.setLayoutProperty(id, 'visibility', 'visible');
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

$('input[name=messtischblatt]').change(function() {
  // Deal with actual checkbox
  // var id = $(this).attr("id");
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
