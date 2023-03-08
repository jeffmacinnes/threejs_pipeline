import countryGEO from '../data/processed/countryGEO.json' assert { type: 'json' };

export const getCountryDisplayFromISO3 = (iso3) => {
  // return the preferred country name for the given iso-3 country code (e.g. ARU)
  let found = countryGEO.find((d) => d.isoAlpha3 === iso3);
  if (found) {
    return found.preferredName;
  } else {
    console.log(`COULD NOT FIND COUNTRY INFO FOR ISO ${iso3} IN countryGEO.JSON`);
    return null;
  }
};

export const getCountryDisplayFromCountryName = (countryName) => {
  // return the preferred country name for the given country name string (e.g. "Rep. of Korea")
  let found = countryGEO.find((d) => d.possibleNames.includes(countryName));
  if (found) {
    return found.preferredName;
  } else {
    console.log(`COULD NOT FIND COUNTRY INFO FOR ${countryName} IN countryGEO.JSON`);
    return null;
  }
};

export const getISO3FromCountryName = (countryName) => {
  // return the iso-3 country code for the given country name string
  let found = countryGEO.find((d) => d.possibleNames.includes(countryName));
  if (found) {
    return found.isoAlpha3;
  } else {
    // console.log(`COULD NOT FIND ISO INFO FOR ${countryName} IN countryGEO.JSON`);
    return null;
  }
};
