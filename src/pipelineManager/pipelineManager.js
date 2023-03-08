import SceneChooser from './SceneChooser/SceneChooser.js';
import RenderQueue from './RenderQueue/RenderQueue.js';
import CompletedRenders from './CompletedRenders/CompletedRenders.js';

import sceneTitles from '../data/processed/sceneTitles.json' assert { type: 'json' };
import { screens } from '../utils/screens.js';

// --- Data (can be updated later with real data)
let scenes = sceneTitles.map((d) => d.shortName);
let formats = Object.keys(screens);
scenes = scenes.map((scene) => ({ scene, formats }));

// --- Socket
const socket = io();
socket.emit('connectToPipelineRoom');
socket.emit('requestStatus');
socket.on('status', (msg) => {
  try {
    // find any non-idle scenes
    let { scenes } = msg;
    let activeScenes = scenes.filter((d) => !['idle', 'completed'].includes(d.state));
    renderQueue.update(activeScenes);

    // get completed ones
    let completedScenes = scenes.filter((d) => d.state === 'completed');
    completedRenders.update(completedScenes);
  } catch (err) {
    console.error(err);
  }
});

// setInterval(() => {
//   console.log('requesting status');
//   socket.emit('requestStatus');
// }, 5000);

// --- Prep Components
const sceneChooser = new SceneChooser(socket, scenes);
const renderQueue = new RenderQueue();
const completedRenders = new CompletedRenders();
