import csv from 'csvtojson';

// generic load CSV
export const loadCSV = async (filepath) => {
  return await csv().fromFile(filepath);
};
