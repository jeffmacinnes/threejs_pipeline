import * as THREE from 'three';
import * as d3 from 'd3';

import Label from '../../world/Label.js';
import { color } from '../../utils/color.js';
import data from '../../data/processed/sampleData.json' assert { type: 'json' };

export default class SampleScene {
  constructor(config, overlay) {
    this.config = config;
    this.overlay = overlay;

    // prep data
    this.data = data;

    console.log(this.config.model);

    // construct scene objects, add animations, init everythign
    this.makeTheModel();
    this.buildAnimations();
    this.init();
  }

  makeTheModel() {
    // construct the Obj3D that will hold all meshes for your scene
    this.theModelContainer = new THREE.Object3D();

    // add a box for each data entry
    this.boxes = [];
    this.data.forEach((d, i) => {
      // let geo = new THREE.BoxGeometry(50, 50, 50);
      // let mat = new THREE.MeshStandardMaterial({
      //   color: color.magenta.hex,
      //   transparent: true,
      //   opacity: 0.8
      // });
      // let mesh = new THREE.Mesh(geo, mat);

      let mesh = this.config.model.scene.clone();

      // update material
      mesh.traverse((o) => {
        if (o.isMesh) {
          o.material = new THREE.MeshStandardMaterial({
            color: color.cyan.hex
          });
        }
      });

      mesh.position.set(i * 200, 0, 0);
      mesh.scale.set(100, 100, 100);

      // store in array for easy reference later
      this.boxes.push({
        mesh
      });

      // add this mesh to the model
      this.theModelContainer.add(mesh);
    });
  }

  getTheModel() {
    return this.theModelContainer;
  }

  buildAnimations() {
    // main timeline
    this.sceneTL = gsap.timeline();
    this.sceneTL.add('tl-start');

    // add animation for each box to the timeline
    this.boxes.forEach((box) =>
      this.sceneTL.to(
        box.mesh.rotation,
        {
          duration: this.config.duration,
          ease: 'back.inOut(2)',
          x: Math.PI * 100
        },
        'tl-start'
      )
    );
  }

  init() {
    this.frameCount = 0;
  }

  update() {
    let progressPCT = this.frameCount / this.config.totalFrames;
    this.sceneTL.progress(progressPCT, true).pause();

    this.frameCount++;
  }
}
