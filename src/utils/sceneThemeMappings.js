import sceneTitles from '../data/processed/sceneTitles.json' assert { type: 'json' };
// scene-theme mappings defined in the sceneTitles.json as downloaded from gsheets

export const getSceneByTheme = (theme) => {
  // return the scene linked to the given theme (e.g. 'Econ1')
  let found = sceneTitles.find((d) => d.theme === theme);
  if (found) {
    return found.scene;
  } else {
    console.log(`COULD NOT FIND A SCENE ASSOCIATED WITH THEME ${theme}`);
    return null;
  }
};

export const getThemeByScene = (scene) => {
  // return the theme linked to the given scene (e.g. 'renewableEnergy')
  let found = sceneTitles.find((d) => d.shortName === scene);
  if (found) {
    return found.theme;
  } else {
    console.log(`COULD NOT FIND A THEME ASSOCIATED WITH SCENE ${scene}`);
    return null;
  }
};
