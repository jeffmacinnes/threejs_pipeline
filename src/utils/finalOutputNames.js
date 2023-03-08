export const getFinalOutputName = (scene, format) => {
  // lookup the RAA final output name based on input name, where input name is 'shortName-format'
  let lookupName = `${scene}-${format}`;
  if (!Object.keys(nameMap).includes(lookupName)) {
    console.log(`Could not find a RAA final output name for ${scene} ${format}`);
    return `${scene}-${format}_final`;
  }

  return `${nameMap[lookupName]}_${scene}`;
};

// name mappings; shortName-format -> RAA name
const nameMap = {
  // -- HD ---
  'sample-HD': '999_Schema_Edit_1_HD',

  // --- fourk ---
  'sample-fourK': '999_Schema_Edit_1_4K',

  // --- plenary ---
  'sample-plenary': '999_Schema_Edit_1_Plenary'
};
