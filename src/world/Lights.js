import * as THREE from 'three';

export default class Lights {
  constructor(setup) {
    // parent container for lights
    this.obj = new THREE.Object3D();

    switch (setup) {
      case 'A':
        this.setupA();
        break;
      case 'B':
        this.setupB();
        break;
      default:
        this.setupA();
        console.log(`Cannot find a lighting setup to match ${setup}. Defaulting to setup A`);
    }
  }

  setupA() {
    // Jon's lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(120, 100, 120);
    this.obj.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-120, 100, 120);
    this.obj.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.7);
    backLight.position.set(0, 100, -150);
    this.obj.add(backLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    this.obj.add(ambientLight);
  }

  setupB() {
    // carbon capture
    const keyLight1 = new THREE.DirectionalLight(0xffffff, 0.75);
    keyLight1.position.set(120, 200, 200);
    keyLight1.target.position.set(35, 40, 0);
    this.obj.add(keyLight1.target);
    this.obj.add(keyLight1);

    const keyLight2 = new THREE.DirectionalLight(0xffffff, 0.75);
    keyLight2.position.set(120, 200, 200);
    keyLight2.target.position.set(-35, 40, 0);
    this.obj.add(keyLight2.target);
    this.obj.add(keyLight2);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(0, 100, 0);
    this.obj.add(fillLight);

    const backLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight1.position.set(-100, 20, -150);
    backLight1.target.position.set(35, 0, 0);
    this.obj.add(backLight1.target);
    this.obj.add(backLight1);

    const backLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight2.position.set(-100, 30, -150);
    backLight2.target.position.set(-35, 0, 0);
    this.obj.add(backLight2.target);
    this.obj.add(backLight2);

    const uplight = new THREE.DirectionalLight(0xffffff, 0.2);
    uplight.position.set(0, -100, -150);
    this.obj.add(uplight);
  }
}
