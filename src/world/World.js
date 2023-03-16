import SampleScene from '../scenes/SampleScene/SampleScene.js';

import * as THREE from 'three';
import { createApp } from 'vue';
import { createNanoEvents } from 'nanoevents';
import { color } from '../utils/color.js';
import { screens } from '../utils/screens.js';
import { lightSetups } from '../utils/lights.js';
import { legends } from '../utils/legends.js';
import Lights from './Lights.js';
import Overlay from './Overlay.js';
import CameraController from './CameraController.js';
import Editor from '../cameraEditor/Editor.js';
import { io } from 'socket.io-client';

export default class World {
  constructor(config) {
    this.config = config;
    this.config.fps = 60;
    this.config.totalFrames = 3600;
    this.config.duration = this.config.totalFrames / this.config.fps;
    this.config.screen = screens[this.config.format];
    this.config.legend = legends[this.config.scene];
    this.config.lightSetup = lightSetups[this.config.scene];
    this.config.rootScale = 1;

    this.frameIndex = -1;
    this.sceneFrameIndex = -1;
    this.playing = false;
    this.emitter = createNanoEvents();

    // prep DOM
    this.prepDOM();

    // set up renderer
    this.setupRenderer();

    // set up scene
    this.theWorld = new THREE.Scene();
    this.theWorld.background = new THREE.Color(color.black.hex);

    // add fog to some scenes
    if (this.config.scene === 'sample')
      this.theWorld.fog = new THREE.Fog(color.black.hex, -200, 700);

    //create overlay class
    if (this.config.debug) {
      this.overlay = {
        init: () => null,
        update: () => null
      };
    } else {
      this.overlay = new Overlay(this.config);
    }
    // this.overlay = new Overlay(this.config);

    // setup camera
    this.setupCamera();

    // add lights to world
    let lights = new Lights(this.config.lightSetup);
    this.theWorld.add(lights.obj);

    // make the data scene and add it to the world
    let sceneName = this.config.scene || null;
    switch (sceneName) {
      case 'sample':
        this.theDataScene = new SampleScene(this.config, this.overlay);
        break;
      default:
        console.error(
          `Cannot find a js scene corresponding to the scene specified in the config file: ${sceneName}`
        );
    }
    this.theWorld.add(this.theDataScene.getTheModel());

    // Set up timeline editing
    if (this.config.editor) {
      this.displayEditor();
      this.emitter.emit(
        'keyframesChange',
        this.cameraController.keyframes,
        this.cameraController.maxFrameIndex
      );
    } else {
      this.playing = true;
    }

    // Set up debugging
    if (this.config.debug) {
      window.addEventListener('resize', this.scaleScene.bind(this), false);
      this.scaleScene();
      this.displayConfig();
    }

    // handle key events
    document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.addEventListener('keydown', this.onKeyDown.bind(this), false);
    document.addEventListener('keyup', this.onKeyUp.bind(this), false);
    this.mouseX = this.mouseY = 0;

    // start animation loop
    if (this.config.export) {
      document.title = `${this.config.scene}-${this.config.format}  ${this.config.startFrame}:${this.config.endFrame}`;

      // init the scene and overlay
      this.theDataScene.init();
      this.overlay.init();

      // fast forward to desired start frame
      this.startFrameIndex = this.config.startFrame - 1;
      this.endFrameIndex = this.config.endFrame - 1;
      while (this.frameIndex < this.startFrameIndex - 1) {
        this.overlay.update();
        this.theDataScene.update();
        this.frameIndex++;
      }
      if (this.frameIndex > 0) {
        this.setFrameIndex(this.frameIndex);
      }

      // check in with pipeline server
      this.socket = io();
      this.socket.emit('rendering-client', {
        scene: this.config.scene,
        totalFrames: this.config.totalFrames,
        format: this.config.format
      });

      // hacky fix to make sure any bbgLabel has a chance to sync and be added to scene graph
      setTimeout(() => {
        this.exportAnimate();
      }, 1000);
    } else {
      this.animate();
    }
  }

  on(eventType, callback) {
    return this.emitter.on(eventType, callback);
  }

  prepDOM() {
    // prep the DOM containers that will hold the Three.js scene and titles
    let { screen } = this.config;
    let rootID = 'root';
    let div = document.createElement('div');
    div.id = rootID;
    if (this.config.debug) {
      div.classList.add('debug');
    }
    div.style.position = 'relative';
    div.style.width = screen.width;
    div.style.height = screen.height;
    document.body.appendChild(div);
    this.config.rootDiv = div;
  }

  displayEditor() {
    let div = document.createElement('div');
    div.id = 'editor-container';
    this.config.rootDiv.appendChild(div);
    createApp(Editor, { world: this }).mount(div);
  }

  displayConfig() {
    // show config settings below main scene
    let div = document.createElement('div');
    div.id = 'config-container';
    let settings = [
      { display: 'Scene', value: this.config.scene },
      { display: 'Theme', value: this.config.theme },
      { display: 'Format', value: this.config.format },
      { display: 'Dims', value: `${this.config.screen.width} x ${this.config.screen.height}` }
    ];
    settings.forEach((setting) => {
      let child = document.createElement('div');
      child.innerHTML = `<div class="label">${setting.display}</div> ${setting.value}`;
      div.appendChild(child);
    });
    this.config.rootDiv.appendChild(div);
  }

  scaleScene() {
    // scale root div so scene fills current browser width
    let currentW = window.innerWidth;
    let scale = (currentW / this.config.screen.width) * 0.985; // tweak scale down slights to avoid scroll bar
    this.config.rootDiv.style.transformOrigin = `top left`;
    this.config.rootDiv.style.transform = `scale(${scale}, ${scale})`;
    this.config.rootScale = scale;
  }

  setupRenderer() {
    // set up renderer and add it to DOM
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.config.screen.width, this.config.screen.height);
    this.config.rootDiv.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    // set up camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.config.screen.width / this.config.screen.height,
      0.1,
      1000
    );
    // original camera position
    this.camera.position.z = 300;
    this.camera.position.y = 0;
    this.camera.rotation.x = 0;

    // Camera controller
    this.cameraController = new CameraController(this);
  }

  // set up animation
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.playing || this.frameIndex < 0) {
      if (this.frameIndex < this.config.totalFrames) {
        this.setFrameIndex(this.frameIndex + 1);
      }
    }

    // If we went backwards in time, reset the scene.
    if (this.sceneFrameIndex > this.frameIndex) {
      if (this.theDataScene.init) {
        this.theDataScene.init();
      }

      if (this.overlay.init) {
        this.overlay.init();
      }

      this.sceneFrameIndex = -1;
    }

    // Move forward as much as we need to get to the frame we want.
    while (this.sceneFrameIndex < this.frameIndex) {
      this.overlay.update();
      this.theDataScene.update();
      this.sceneFrameIndex++;
    }

    // Camera
    this.cameraController.update();

    // Render
    this.renderer.render(this.theWorld, this.camera);
  }

  // export frames to server
  async exportAnimate() {
    // update frame index
    while (this.frameIndex < this.endFrameIndex) {
      this.frameIndex++;
      this.setFrameIndex(this.frameIndex);

      // update everything
      this.overlay.update();
      this.theDataScene.update();

      // Render
      this.renderer.render(this.theWorld, this.camera);

      // --- SEND FRAME TO SERVER -------------------------------
      let frameNum = this.frameIndex + 1;

      // --- for html2canvas
      let canvas = await html2canvas(this.config.rootDiv);
      let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

      // --- for just canvas
      // const blob = await new Promise((resolve) => {
      //   return this.renderer.domElement.toBlob(resolve, 'image/png');
      // });

      let formData = new FormData();
      formData.append('frameNum', `${frameNum}`);
      formData.append('format', this.config.format);
      formData.append('scene', this.config.scene);
      formData.append('image', blob);

      try {
        let response = await fetch('/image', {
          method: 'POST',
          body: formData
        });
        let result = await response.json();
      } catch (error) {
        console.log('error', error);
      }
    }

    // put done tag on page so that puppeteer can catch it and close
    let done = document.createElement('div');
    done.id = 'done-tag';
    document.body.appendChild(done);
  }

  // // (KEEP THIS IN JUST IN CASE) prompt user for directory, save frames using file system API
  // async saveFrames() {
  //   document.title = `${this.config.scene}-${this.config.format}`;

  //   // prompt user for save dir
  //   const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });

  //   this.socket = io();
  //   this.socket.emit('rendering-client', {
  //     scene: this.config.scene,
  //     totalFrames: this.config.totalFrames,
  //     format: this.config.format
  //   });

  //   while (this.frameIndex < this.endFrameIndex) {
  //     this.frameIndex++;
  //     this.setFrameIndex(this.frameIndex);

  //     // update everything
  //     this.overlay.update();
  //     this.theDataScene.update();

  //     // Render
  //     this.renderer.render(this.theWorld, this.camera);

  //     // --- SAVE FAME -------------------------------
  //     let frameNum = `${this.frameIndex + 1}`;
  //     const fileHandle = await dirHandle.getFileHandle(`${frameNum.padStart(5, '0')}.png`, {
  //       create: true
  //     });
  //     const writable = await fileHandle.createWritable();

  //     // --- for html2canvas
  //     // let canvas = await html2canvas(this.config.rootDiv);
  //     // let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

  //     // --- for just canvas
  //     const blob = await new Promise((resolve) => {
  //       return this.renderer.domElement.toBlob(resolve, 'image/png');
  //     });

  //     await writable.write(blob);
  //     await writable.close();

  //     // update server
  //     this.socket.emit('saved-frame', {
  //       scene: this.config.scene,
  //       format: this.config.format,
  //       frameNum: frameNum
  //     });
  //   }

  //   // put done tag on page so that puppeteer can catch it and close
  //   let done = document.createElement('div');
  //   done.id = 'done-tag';
  //   document.body.appendChild(done);
  // }

  // capture mouse movement
  onMouseMove(event) {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (event.clientY / window.innerHeight) * 2 - 1;
  }

  onKeyDown(event) {
    if (this.theDataScene.handleKeyDown) {
      this.theDataScene.handleKeyDown(event.key);
    }

    if (this.config.editor) {
      this.cameraController.handleKeyDown(event);
    }
  }

  onKeyUp(event) {
    if (this.config.editor) {
      this.cameraController.handleKeyUp(event);
    }
  }

  getPlaying() {
    return this.playing;
  }

  setPlaying(flag) {
    this.playing = flag;
    this.emitter.emit('playingChange', this.playing);
  }

  getFrameIndex() {
    return this.frameIndex;
  }

  setFrameIndex(value) {
    this.frameIndex = Math.max(0, value);
    this.emitter.emit('frameIndexChange', this.frameIndex);
  }
}
