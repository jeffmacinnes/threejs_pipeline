import * as THREE from 'three';
import { config } from './config.js';
import { getThemeByScene } from './utils/sceneThemeMappings.js';
import World from './world/World.js';

function loadTexture(path) {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(path, resolve);
  });
}

function launch() {
  // --- THREE LOADING FUNCS  ----------------
  // THREE.Cache.enabled = true; // for enabling file loading

  /* --- CONFIG ---------------------
    The rendering pipeline will pass in scene and format params via the url, 
    in which case it will overwrite whatever is in the config.js file
  */
  const queryString = window.location.search;
  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    if (!(urlParams.has('scene') && urlParams.has('format'))) {
      console.error('URL config parameters must include both scene and format');
    }
    config.scene = urlParams.get('scene');
    config.format = urlParams.get('format');
    config.startFrame = parseInt(urlParams.get('startFrame'));
    config.endFrame = parseInt(urlParams.get('endFrame'));
    config.export = true;
    config.debug = false;
    config.editor = false;
  }

  // --- Create an array of all promises that need to complete prior to init
  let promises = [];

  // --- Load the Titles
  promises.push(
    fetch('./data/processed/sceneTitles.json')
      .then((resp) => resp.json())
      .then((titles) => {
        let found = titles.find((d) => d.shortName === config.scene);
        if (found) {
          config.titles = found;
        }
      })
  );

  // --- Load the camera path (if any)
  promises.push(
    fetch(`./cameraPaths/${config.scene}-${config.format}.json`)
      .then((resp) => {
        if (!resp.ok) {
          config.cameraPath = null;
        } else {
          return resp.json();
        }
      })
      .then((json) => (config.cameraPath = json))
  );

  // --- Load the earth texture
  promises.push(
    loadTexture('assets/images/earth_texture.png').then((texture) => {
      config.earthTexture = texture;
    })
  );

  // add the pillar info to config
  config.theme = getThemeByScene(config.scene);

  // Initiate the world once all promises complete (or, if no promises, just initiate)
  let theWorld;
  if (promises.length > 0) {
    Promise.all(promises).then(() => {
      console.log('Everything loaded!');
      theWorld = new World(config);
    });
  } else {
    theWorld = World(config);
  }
}

launch();
