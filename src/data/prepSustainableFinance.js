import fs from 'fs';
import { loadCSV } from './utils.js';

(async () => {
  // load data
  let data = await loadCSV('raw/sustainableFinance_20221002.csv');
  let rawGEO = fs.readFileSync('processed/countryGEO.json');
  let geo = JSON.parse(rawGEO);

  // output name
  let fName = `sustainableFinance.json`;

  const getCountryGeo = (countryName) => {
    // return the geo info for the given country name
    let found = geo.filter((d) => d.possibleNames.includes(countryName));
    if (found.length > 0) {
      let { lat, lng, isoAlpha3: isoA3, preferredName: display } = found[0];
      return { lat, lng, isoA3, display };
    } else {
      console.log(`COULD NOT FIND GEO INFO FOR ${countryName}`);
      return null;
    }
  };

  // add geo info to all reporters/partners
  data = data
    .map((d) => {
      let countryGeo = getCountryGeo(d['Country of risk']);
      d['baseline'] = d['Pre-2012'];
      delete d['Pre-2012'];
      delete d['Country of risk'];

      for (let key in d) {
        d[key] = +d[key].replace(/,/g, '');
      }

      return {
        ...d,
        countryGeo
      };
    })
    .filter((d) => d.countryGeo !== null);

  // change values so they accumulate over time
  const years = [...Array(11).keys()].map((i) => 2012 + i);
  data = data.map((d) => {
    let { countryGeo } = d;
    let yearlyData = [];
    let val = d.baseline;
    for (let i = 0; i < years.length; i++) {
      let year = years[i];
      val = val + d[year];
      yearlyData.push({ year, raw: d[year], total: val });
    }
    return {
      countryGeo,
      yearlyData
    };
  });

  fs.writeFileSync(`processed/${fName}`, JSON.stringify(data, null, 2));
  console.log(`Done. Processed datafile is in processed/${fName}`);
})();
