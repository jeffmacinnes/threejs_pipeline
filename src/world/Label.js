// Class for placing text labels within the THREE.js Scene
// This label gets placed WITHIN the 3D world coordinates of the scence
import { Text } from '../lib/troika-three-text_modified.js';
import { color as sceneColors } from '../utils/color.js';
import * as THREE from 'three';

const fontPaths = {
  'NHaas Grotesk Thin': './assets/fonts/NHaasGroteskDSPro-25Th.otf',
  'NHaas Grotesk Light': './assets/fonts/NHaasGroteskDSPro-45Lt.otf',
  'NHaas Grotesk Bold': './assets/fonts/NHaasGroteskDSPro-75bd.otf',
  'NHaas Grotesk Black': './assets/fonts/NHaasGroteskDSPro-95Blk.otf',
  'NHaas Grotesk Medium': './assets/fonts/NHaasGroteskDSPro-65Md.otf'
};

const getFontPath = (fontName) => {
  if (!Object.keys(fontPaths).includes(fontName)) {
    console.log(`Can't find a font path for ${fontName}. Add it to Label.js`);
    return null;
  }
  return fontPaths[fontName];
};

export default class Label {
  constructor({
    // defaults
    text = 'Hello, there',
    anchorX = 'center', // alignment relative to local origin
    anchorY = 'center',
    color = sceneColors.palePaperBlue.hex,
    outlineColor = sceneColors.darkNavyBlue.hex,
    outlineWidth = 0,
    font = 'NHaas Grotesk Light',
    includeBg = false, // include a label background or not
    maxWidth = 50,
    fontSize = 24, // em-height, in world units,
    pos = [0, 0, 0],
    textAlign = 'center' // alignment within text bbox
  }) {
    // see: https://www.npmjs.com/package/troika-three-text for full set of text options
    this.TTT = new Text();
    this.TTT.text = text;
    this.TTT.anchorX = anchorX;
    this.TTT.anchorY = anchorY;
    this.TTT.maxWidth = maxWidth;
    this.TTT.color = color;
    this.TTT.outlineColor = outlineColor;
    this.TTT.outlineWidth = outlineWidth;
    this.TTT.font = getFontPath(font);
    this.TTT.fontSize = fontSize;
    this.pos = pos;
    this.TTT.textAlign = textAlign;

    this.TTT.name = 'Label';
    this.includeBg = includeBg;
    this.width = 0;
    this.height = 0;

    if (this.includeBg) {
      // create a background mesh to put behind the label
      const parent = new THREE.Object3D();
      this.TTT.sync(() => {
        // need to call this in sync so that bounding box can be computed first
        let bgMesh = this.createBackground(this.TTT);
        parent.add(bgMesh);
        parent.add(this.TTT);
      });
      parent.position.set(this.pos[0], this.pos[1], this.pos[2]);
      this.obj = parent;
    } else {
      this.TTT.sync(() => {
        // set width as width of text bounding box
        let bbox = this.TTT.textRenderInfo.blockBounds;
        this.width = bbox[2] - bbox[0];
      });
      this.TTT.position.set(this.pos[0], this.pos[1], this.pos[2]);
      this.obj = this.TTT;
    }
  }

  createBackground(t) {
    // get size and location of text block
    let bbox = t.textRenderInfo.blockBounds;
    let width = bbox[2] - bbox[0];
    let height = bbox[3] - bbox[1];
    let centerX = bbox[2] - width / 2;
    let centerY = bbox[3] - height / 2;

    // build mesh for background
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      color: 0x000000,
      opacity: 0.5
    });
    const bg = new THREE.Mesh(geo, mat);
    bg.name = 'label-bg';

    // scale the bg up slightly
    let scaleFactor = 1.1;
    bg.scale.x = scaleFactor;

    // position background relative to text block
    bg.position.set(centerX, centerY, -0.1);

    // update class width prop to be width of bbounding box
    this.width = width * scaleFactor;
    this.height = height * scaleFactor;
    return bg;
  }

  updateText(newText) {
    if (this.includeBg) {
      // update text
      this.TTT.text = newText;

      // remove current background
      let bg = this.obj.getObjectByName('label-bg');
      if (!bg) {
        return;
      }
      bg.removeFromParent();

      // create new background
      this.TTT.sync(() => {
        // need to call this in sync so that bounding box can be computed first
        let bgMesh = this.createBackground(this.TTT);
        this.obj.add(bgMesh);
      });
    } else {
      this.TTT.text = newText;
      this.TTT.sync(() => {
        // set width as width of text bounding box
        let bbox = this.TTT.textRenderInfo.blockBounds;
        this.width = bbox[2] - bbox[0];
        this.height = bbox[3] - bbox[1];
      });
      this.obj.text = newText;
    }
  }

  showLabelTL() {
    // return a gsap timeline that shows this arc
    let tl = gsap.timeline();
    tl.add('start');

    let opacity = { value: 0 }; // starting value
    tl.to(
      opacity,
      {
        duration: 0.5,
        value: 1,
        onUpdate: () => (this.obj.material.opacity = opacity.value)
      },
      'start'
    );

    return tl;
  }

  hideLabelTL() {
    // return a gsap timeline that hides this arc
    let tl = gsap.timeline();
    tl.add('start');

    let opacity = { value: 1 }; // starting value
    tl.to(
      opacity,
      {
        duration: 0.5,
        value: 0,
        onUpdate: () => (this.obj.material.opacity = opacity.value)
      },
      'start'
    );

    return tl;
  }
}
