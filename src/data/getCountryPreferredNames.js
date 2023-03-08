// write preferred country names to csv for review by bloomberg
import fs from 'fs';
import fastcsv from 'fast-csv';

(async () => {
  // Write a file that has the preferred name for every country in it. Subsequent data files can reference this file in order to standardize country names
  let rawGEO = fs.readFileSync('processed/countryGEO.json');
  let geo = JSON.parse(rawGEO);

  let preferredNames = geo.map((d, i) => ({ index: i, preferredName: d.preferredName }));

  const ws = fs.createWriteStream('processed/preferredNames.csv');
  fastcsv.write(preferredNames, { headers: true }).pipe(ws);
})();
