import { worldMapData } from '../data/processed/world_map_data2.js';
import { getISO3FromCountryName, getCountryDisplayFromISO3 } from '../utils/countryUtils.js';

export default class Map {
  constructor() {
    // canvas
    this.canvas = document.createElement('CANVAS');
    this.canvas.id = 'map-reference';
    this.canvas.width = 1200;
    this.canvas.height = 600;
    document.body.appendChild(this.canvas); // UNCOMMENT TO SHOW MAP
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.assignUniqueColors();

    this.setAllCountryValues(0.5);
    this.redrawMap();
  }

  assignUniqueColors() {
    // give each country a unique color property that can be referenced later if needed
    let colors = [];
    var red, green, blue;
    for (red = 0; red <= 255; red++) {
      for (green = 0; green <= 255; green++) {
        for (blue = 0; blue <= 255; blue++) {
          colors.push([red, green, blue]);
        }
      }
    }

    // define array of unique color combos
    let step = 50000; // huge step to emphasize diff for when map canvas is being displayed
    worldMapData.features.forEach((country, i) => {
      let colorIdx = i * step;
      if (colorIdx > Math.pow(255, 3)) {
        console.log('Too many countries! Try lowering the step value in Map.assignUniqueColors');
      }
      let c = colors[colorIdx];
      country.uniqueColor = { r: c[0], g: c[1], b: c[2] };
    });
  }

  // set map visibility in the DOM
  setMapVisibity(visible) {
    if (visible) this.canvas.style.display = 'block';
    else this.canvas.style.display = 'none';
  }

  // return the canvas value at given x/y, where x/y are proportions of canvas width/height
  getMapValue(sampleX, sampleY) {
    if (sampleX < 0 || sampleX >= this.canvas.width) return 0;

    if (sampleY < 0 || sampleY >= this.canvas.height) return 0;

    return this.ctx.getImageData(sampleX, sampleY, 1, 1).data;
  }

  // return the canvas value at the given lat/lon
  getMapValueLatLon(latitude, longitude) {
    // translate lat/lon to canvas coords
    var sampleX = 600 + (longitude / 180.0) * 600.0;
    var sampleY = 300 + ((latitude * -1) / 90.0) * 300.0;

    if (sampleX < 0 || sampleX >= this.canvas.width) return [0, 0, 0];

    if (sampleY < 0 || sampleY >= this.canvas.height) return [0, 0, 0];

    // console.log('here', sampleX, sampleY);
    return this.ctx.getImageData(sampleX, sampleY, 1, 1).data;
  }

  // return the x,y,z of given lat/lon in flat map projection
  getFlatMap3DPoint(lat, lon) {
    var x = lon * 1.0;
    var y = lat * 1.0;
    var z = 0;
    return [x, y, z];
  }

  // return x,y,z of given lat/lon in spherical map projection
  getGlobeMap3DPoint(latitude, longitude) {
    var radius = 100.0;
    var latRad = ((latitude * -1) / 180.0) * 3.14159;
    var lonRad = ((-1.0 * longitude) / 180.0) * 3.14159;

    var R = Math.cos(latRad) * radius;
    var x = Math.cos(lonRad) * R;
    var y = -1.0 * Math.sin(latRad) * radius;
    var z = Math.sin(lonRad) * R;

    return [x, y, z];
  }

  // return x,z,y of given lat/lon in cylindrical map projection
  getCylinderMap3DPoint(latitude, longitude) {
    var radius = 100.0;
    var latRad = (latitude / 180.0) * 3.14159;
    var lonRad = ((-1.0 * longitude) / 180.0) * 3.14159;
    var x = Math.cos(lonRad) * radius;
    var y = -1.0 * latRad * 100.0;
    var z = Math.sin(lonRad) * radius;
    return [x, y, z];
  }

  getISO3ByLatLon(lat, lon) {
    /* return the iso-a3 value of the country within which the lat,lon values fall. 
    this assumes you have already called:
      Map.setUniqueCountryValues();
      Map.redrawMap();
    */
    let colorVal = this.getMapValueLatLon(lat, lon);
    let r = colorVal[0];
    let g = colorVal[1];
    let b = colorVal[2];
    let country = worldMapData.features.find((d) => {
      let { uniqueColor } = d;
      return r === uniqueColor.r && g === uniqueColor.g && b === uniqueColor.b;
    });
    if (country) {
      return country.properties.iso_a3_eh;
    } else {
      return null;
    }
  }

  convertValueToColor(V) {
    /* return a color obj like {r: 255, g: 255, b: 255 } for the given value V
       'V' can be either scalar (0-1) or array ([r,g,b]), where r,g,b are each between 0-255. 
      If scalar, the color will be set to [255 * V, 255 * V, 255 * V]
    */
    if (Array.isArray(V)) {
      if (V.some((d) => d < 0 || d > 255)) {
        console.error(`all values must be between 0-255, got ${V}`);
      }
      return { r: V[0], g: V[1], b: V[2] };
    } else {
      return { r: V * 255, g: V * 255, b: V * 255 };
    }
  }

  setAllCountryValues(V) {
    /* assign same value to all countries in worldMapData set
     'V' can be either scalar (0-1) or array ([r,g,b]), where r,g,b are each between 0-255. 
      If scalar, the color will be set to [255 * V, 255 * V, 255 * V]
    */
    let valStr = Array.isArray(V) ? `${V}` : `${V.toFixed(3)}`;
    console.log(`setting all countries to ${valStr}`);
    let color = this.convertValueToColor(V);
    worldMapData.features.forEach((country) => {
      country.color = color;
    });
  }

  setUniqueCountryValues() {
    // set each country to its unique value
    console.log(`setting unqiue country values`);
    worldMapData.features.forEach((country) => {
      country.color = country.uniqueColor;
    });
  }

  setCountryValue(countryStr, V) {
    /*
      'countryStr' can be either 3-letter ISOA3 code, or country name string. 
      If it's a name string, will attempt to lookup 3-letter ISOA3 code. This
      ensures a standardized lookup for countries across datasets. 

      'V' can be either scalar (0-1) or array ([r,g,b]), where r,g,b are each between 0-255. 
      If scalar, the color will be set to [255 * V, 255 * V, 255 * V]
    */
    let iso3 = countryStr.length === 3 ? countryStr : getISO3FromCountryName(countryStr);
    let color = this.convertValueToColor(V);
    let valStr = Array.isArray(V) ? `${V}` : `${V.toFixed(3)}`;
    // console.log(`setting ${countryStr} to ${valStr}`);

    // update the map value of the country with the specified iso-a3 code
    let country = worldMapData.features.find((d) => d.properties.iso_a3_eh === iso3);
    if (country) {
      country.color = color;
      return;
    } else {
      // console.log(
      //   `could not find country with iso_a3_eh code ${iso3} (${getCountryDisplayFromISO3(
      //     iso3
      //   )}) in worldMapData`
      // );
    }
  }

  redrawMap() {
    var countrySet = worldMapData.features;

    var ctx = this.ctx;

    // for each country
    for (var i = 0; i < countrySet.length; i++) {
      // get country and coordset
      var country = countrySet[i];
      var coordSet = country.geometry.coordinates;

      // print country name
      var countryName = country.properties.name_en;
      // console.log( "------" );
      // console.log( country.properties.name_en );

      // get country's color
      var { color } = country;
      var countryColor = `rgb(${color.r}, ${color.g}, ${color.b})`;

      // for each set of coordinates in a country
      for (var s = 0; s < coordSet.length; s++) {
        var coords = coordSet[s];
        // console.log( s + " - " + coords.length );
        // console.log( coords );

        if (coords.length == 1)
          // this is weird but necessary
          coords = coords[0];

        // begin polygon drawing
        ctx.beginPath();
        for (var n = 0; n < coords.length; n++) {
          var x = (coords[n][0] * 600) / 180.0 + 600;
          var y = 300 - (coords[n][1] * 300) / 90.0;

          if (n == 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = countryColor;
        ctx.stroke();
        ctx.fillStyle = countryColor;
        ctx.fill();
      }
    }
  }
}
