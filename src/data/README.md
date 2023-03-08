# Bloomberg NEF 2022 Data

Original data from Bloomberg: https://drive.google.com/drive/u/2/folders/1MW4Da5LhufrvePHI3X5wrUPgvFnKv0SI

Raw data files (e.g. data from Bloomberg, or supplemental data like country codes, etc) can be placed in `raw` directory.

The `prep...` scripts in this folder will act on files in the `raw` dir to clean, preprocess, and reformat as needed for each of the visualizations. Cleaned data will be saved to the `processed` directory.

### Country Geo Data

One of the irksome issues working with data with per-country values is that different datasets might refer to the same country in different ways (e.g. United States, United States of America, USA, U.S.A., etc...).

To help standardized the supplemental geo data that might be useful for these visualizations, there's a file `processed/countryGEO.json` that stores lat/lng coordinates and iso alpha2 and alpha3 codes for each country, the preferred name, as well as an array of `possibleNames` that you might find associated with each country across the different datasets.

If you want to add geo data to a particular dataset, you might do something like:

```
  let rawGEO = fs.readFileSync('processed/countryGEO.json');
  let geo = JSON.parse(rawGEO);

  const getCountryGeo = (countryName) => {
    // return the geo info for the given country name
    let found = geo.filter((d) => d.possibleNames.includes(countryName));
    if (found.length > 0) {
      return found[0]
    } else {
      console.log(`COULD NOT FIND GEO INFO FOR ${countryName}`);
      return null;
    }
  };
```

If your dataset has a country-name that's not in the array of `possibleNames` yet, feel free to add it manually to the `processed/countryGEO.json` file.
