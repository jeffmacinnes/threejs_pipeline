import fs from 'fs';
import fetch from 'node-fetch';
import { csvParse } from 'd3-dsv';

const config = {
  google: [
    {
      id: '11NxowTSF5wiuAmZbPjD1KWtsf3awBuP1DWsZReD051k',
      gid: '0',
      filename: 'sceneTitles.json'
    }
  ]
};
const { google } = config;
const fetchGoogle = async ({ id, gid }) => {
  console.log(`fetching...${id}`);

  const base = 'https://docs.google.com';
  const post = gid
    ? `spreadsheets/u/1/d/${id}/export?format=csv&id=${id}&gid=${gid}`
    : `document/d/${id}/export?format=txt`;
  const url = `${base}/${post}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // parse as JSON
    return csvParse(text);
  } catch (err) {
    throw new Error(err);
  }
};

(async () => {
  for (let d of google) {
    try {
      const data = await fetchGoogle(d);
      fs.writeFileSync(`processed/${d.filename}`, JSON.stringify(data, null, 2));
    } catch (err) {
      console.log(err);
    }
  }
})();
