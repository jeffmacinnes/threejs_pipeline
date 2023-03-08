import _ from 'lodash';
import { Euler, MathUtils, Quaternion, SplineCurve, Vector2, Vector3 } from 'three';

// const storageKey = 'cameraControllerData';
// const storageVersion = 1;
const exportTypeCode = 'camera-path';

// ----------
export default class CameraController {
  // ----------
  constructor(world) {
    this.world = world;
    this.config = world.config;
    this.camera = world.camera;
    this.ready = false;
    this.keyMap = {};
    this.keyframes = [];
    this.maxFrameIndex = 0;
    this.nextKeyframeId = 1;
    this.selectedKeyframeId = 0;
    this.filename = `${this.config.scene}-${this.config.format}.json`;

    this.xPositionCurve = new SplineCurve();
    this.yPositionCurve = new SplineCurve();
    this.zPositionCurve = new SplineCurve();
    this.xTargetCurve = new SplineCurve();
    this.yTargetCurve = new SplineCurve();
    this.zTargetCurve = new SplineCurve();

    // let storageData;
    // try {
    //   storageData = JSON.parse(localStorage.getItem(storageKey));
    //   if (storageData) {
    //     this.ingestKeyframes(storageData.keyframes);
    //   }
    // } catch (err) {
    //   console.error(err);
    // }

    world.on('frameIndexChange', () => {
      this.updateForFrameIndex();
    });

    if (this.config.editor) {
      world.renderer.domElement.addEventListener('mousedown', this.handleMouseDown);
    }

    if (world.config.cameraPath) {
      this.ingestFileData(world.config.cameraPath);
    } else {
      console.error(`No camera path loaded for ${world.config.scene}: ${world.config.format}`);
    }
    this.ready = true;

    // this.loadInitial();
  }

  // ----------
  isReady() {
    return this.ready;
  }

  // ----------
  async loadInitial() {
    const url = `./cameraPaths/${this.filename}`;
    console.log(url);
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status !== 404) {
        console.error(`Problem opening ${url}:`, response);
      }

      this.ready = true;
      return;
    }

    const json = await response.json();
    this.ingestFileData(json);
    this.ready = true;
  }

  // ----------
  ingestFileData(data) {
    if (data.type !== exportTypeCode) {
      console.error('bad type');
      return;
    }

    this.ingestKeyframes(data.keyframes);
    this.save();
  }

  // ----------
  ingestKeyframes(keyframes) {
    this.keyframes = keyframes;

    for (const keyframe of this.keyframes) {
      keyframe.id = this.getNextKeyframeId();
    }

    this.updateForKeyframes();
  }

  // ----------
  update() {
    const { camera, keyMap } = this;

    if (keyMap.KeyW) {
      const v = new Vector3(0, 0, -0.3);
      v.applyEuler(camera.rotation);
      camera.position.add(v);
    } else if (keyMap.KeyS) {
      const v = new Vector3(0, 0, 0.3);
      v.applyEuler(camera.rotation);
      camera.position.add(v);
    }

    if (keyMap.KeyA) {
      const v = new Vector3(-0.3, 0, 0);
      v.applyEuler(camera.rotation);
      camera.position.add(v);
    } else if (keyMap.KeyD) {
      const v = new Vector3(0.3, 0, 0);
      v.applyEuler(camera.rotation);
      camera.position.add(v);
    }

    if (keyMap.KeyE) {
      const v = new Vector3(0, -0.3, 0);
      v.applyEuler(camera.rotation);
      camera.position.add(v);
    } else if (keyMap.KeyQ) {
      const v = new Vector3(0, 0.3, 0);
      v.applyEuler(camera.rotation);
      camera.position.add(v);
    }
  }

  // ----------
  handleMouseDown = (event) => {
    this.drag = {
      lastX: event.clientX,
      lastY: event.clientY
    };

    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  };

  // ----------
  handleMouseMove = (event) => {
    const { camera, drag } = this;

    if (!drag) {
      return;
    }

    const factor = 0.001;
    const diffX = event.clientX - this.drag.lastX;
    const diffY = event.clientY - this.drag.lastY;

    camera.rotateY(diffX * factor);
    camera.rotateX(diffY * factor);

    this.drag.lastX = event.clientX;
    this.drag.lastY = event.clientY;
  };

  // ----------
  handleMouseUp = (event) => {
    const { drag } = this;

    if (!drag) {
      return;
    }

    this.drag = null;

    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
  };

  // ----------
  handleKeyDown(event) {
    const { world } = this;
    // console.log(event.code);

    if (event.metaKey || event.crtlKey) {
      return;
    }

    this.keyMap[event.code] = true;

    const frameIndex = world.getFrameIndex();

    if (event.code === 'ArrowLeft') {
      if (event.altKey) {
        world.setFrameIndex(0);
      } else {
        world.setFrameIndex(world.getFrameIndex() - 60);
      }
    } else if (event.code === 'ArrowRight') {
      world.setFrameIndex(world.getFrameIndex() + 60);
    } else if (event.code === 'Backspace') {
      if (this.selectedKeyframeId) {
        this.keyframes = _.filter(
          this.keyframes,
          (keyframe) => keyframe.id !== this.selectedKeyframeId
        );

        this.updateForKeyframes();
        this.save();
        this.updateForFrameIndex();
        this.setSelectedKeyframeId(0);
      }
    } else if (event.code === 'Space') {
      world.setPlaying(!world.getPlaying());
      event.preventDefault();
    } else if (event.code === 'KeyI') {
      let keyframe = _.find(this.keyframes, (keyframe) => keyframe.frameIndex === frameIndex);

      if (keyframe) {
        keyframe.position = this.camera.position.toArray();
        keyframe.rotation = this.camera.rotation.toArray();
      } else {
        keyframe = {
          id: this.getNextKeyframeId(),
          frameIndex: frameIndex,
          position: this.camera.position.toArray(),
          rotation: this.camera.rotation.toArray()
        };

        this.keyframes.push(keyframe);
      }

      this.updateForKeyframes();
      this.save();
      this.setSelectedKeyframeId(keyframe.id);
    }
  }

  // ----------
  handleKeyUp(event) {
    this.keyMap[event.code] = false;
  }

  // ----------
  clear() {
    this.keyframes.length = 0;
    this.updateForKeyframes();
    this.save();
  }

  // ----------
  getNextKeyframeId() {
    const output = this.nextKeyframeId;
    this.nextKeyframeId++;
    return output;
  }

  // ----------
  setSelectedKeyframeId(id) {
    this.selectedKeyframeId = id;
    this.world.emitter.emit('selectedKeyframeIdChange', id);
  }

  // ----------
  duplicateAndSelectKeyframeById(id) {
    const oldKeyframe = _.find(this.keyframes, (keyframe) => keyframe.id === id);
    if (!oldKeyframe) {
      console.error('Keyframe not found', id);
      return;
    }

    const keyframe = _.cloneDeep(oldKeyframe);
    const newId = this.getNextKeyframeId();
    keyframe.id = newId;
    this.keyframes.push(keyframe);

    this.updateForKeyframes();
    this.save();
    this.setSelectedKeyframeId(keyframe.id);
  }

  // ----------
  save() {
    // localStorage.setItem(
    //   storageKey,
    //   JSON.stringify({
    //     version: storageVersion,
    //     keyframes: this.keyframes
    //   })
    // );
  }

  // ----------
  sortKeyframes() {
    this.keyframes.sort((a, b) => {
      return a.frameIndex - b.frameIndex;
    });
  }

  // ----------
  setKeyframeFrameIndex(id, value) {
    const keyframe = _.find(this.keyframes, (keyframe) => keyframe.id === id);
    if (!keyframe) {
      console.error('Keyframe not found', id);
      return;
    }

    keyframe.frameIndex = value;
    this.updateForKeyframes();
    this.save();

    this.updateForFrameIndex();
  }

  // ----------
  updateForKeyframes() {
    const {
      keyframes,
      xPositionCurve,
      yPositionCurve,
      zPositionCurve,
      xTargetCurve,
      yTargetCurve,
      zTargetCurve
    } = this;

    if (keyframes.length) {
      this.sortKeyframes();

      xPositionCurve.points = keyframes.map((keyframe) => {
        return new Vector2(keyframe.frameIndex, keyframe.position[0]);
      });

      yPositionCurve.points = keyframes.map((keyframe) => {
        return new Vector2(keyframe.frameIndex, keyframe.position[1]);
      });

      zPositionCurve.points = keyframes.map((keyframe) => {
        return new Vector2(keyframe.frameIndex, keyframe.position[2]);
      });

      const targetPoints = keyframes.map((keyframe) => {
        const v = new Vector3(0, 0, -100);
        v.applyEuler(new Euler(...keyframe.rotation));
        v.add(new Vector3(...keyframe.position));
        return v;
      });

      xTargetCurve.points = keyframes.map((keyframe, i) => {
        return new Vector2(keyframe.frameIndex, targetPoints[i].x);
      });

      yTargetCurve.points = keyframes.map((keyframe, i) => {
        return new Vector2(keyframe.frameIndex, targetPoints[i].y);
      });

      zTargetCurve.points = keyframes.map((keyframe, i) => {
        return new Vector2(keyframe.frameIndex, targetPoints[i].z);
      });

      xPositionCurve.updateArcLengths();
      yPositionCurve.updateArcLengths();
      zPositionCurve.updateArcLengths();
      xTargetCurve.updateArcLengths();
      yTargetCurve.updateArcLengths();
      zTargetCurve.updateArcLengths();
    }

    if (keyframes.length > 0) {
      const lastKeyframe = keyframes[keyframes.length - 1];
      this.maxFrameIndex = lastKeyframe.frameIndex;
    } else {
      this.maxFrameIndex = 0;
    }

    this.world.emitter.emit('keyframesChange', this.keyframes, this.maxFrameIndex);
  }

  // ----------
  updateForFrameIndex() {
    const {
      world,
      camera,
      keyframes,
      maxFrameIndex,
      xPositionCurve,
      yPositionCurve,
      zPositionCurve,
      xTargetCurve,
      yTargetCurve,
      zTargetCurve
    } = this;

    if (!camera || !keyframes.length) {
      return;
    }

    const frameIndex = world.getFrameIndex();

    const smooth = true;
    if (smooth) {
      let factor = frameIndex / maxFrameIndex;
      if (factor >= 1) {
        factor = 1;
      }

      camera.position.x = xPositionCurve.getPointAt(factor).y;
      camera.position.y = yPositionCurve.getPointAt(factor).y;
      camera.position.z = zPositionCurve.getPointAt(factor).y;

      // Rather than interpolate the components of the rotation, we get better results if we
      // interpolate a target for the camera to look at, so that's what we're doing.
      camera.lookAt(
        xTargetCurve.getPointAt(factor).y,
        yTargetCurve.getPointAt(factor).y,
        zTargetCurve.getPointAt(factor).y
      );
    } else {
      let beforeKeyframe, afterKeyframe;
      for (const keyframe of this.keyframes) {
        if (keyframe.frameIndex >= frameIndex) {
          afterKeyframe = keyframe;
          break;
        }

        beforeKeyframe = keyframe;
      }

      if (beforeKeyframe && afterKeyframe) {
        const factor = MathUtils.mapLinear(
          frameIndex,
          beforeKeyframe.frameIndex,
          afterKeyframe.frameIndex,
          0,
          1
        );

        camera.position.lerpVectors(
          new Vector3(...beforeKeyframe.position),
          new Vector3(...afterKeyframe.position),
          factor
        );

        const beforeQ = new Quaternion();
        beforeQ.setFromEuler(new Euler(...beforeKeyframe.rotation));
        const afterQ = new Quaternion();
        afterQ.setFromEuler(new Euler(...afterKeyframe.rotation));
        beforeQ.slerp(afterQ, factor);
        camera.rotation.setFromQuaternion(beforeQ);
      } else {
        const keyframe = beforeKeyframe || afterKeyframe;
        if (keyframe) {
          camera.position.fromArray(keyframe.position);
          camera.rotation.fromArray(keyframe.rotation);
        }
      }
    }
  }

  // ----------
  async import() {
    const fileHandles = await window.showOpenFilePicker({
      types: [
        {
          description: 'JSON file',
          accept: { 'application/JSON': ['.json'] }
        }
      ]
    });

    const fileHandle = fileHandles[0];
    if (!fileHandle) {
      return;
    }

    const file = await fileHandle.getFile();
    const text = await file.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error(err);
      return;
    }

    this.ingestFileData(data);
  }

  // ----------
  async export() {
    const data = {
      type: exportTypeCode,
      version: 1,
      keyframes: _.map(this.keyframes, (keyframe) => {
        return _.pick(keyframe, ['frameIndex', 'position', 'rotation']);
      })
    };

    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `${this.filename}`,
      types: [
        {
          description: 'JSON file',
          accept: { 'application/JSON': ['.json'] }
        }
      ]
    });

    const fileStream = await fileHandle.createWritable({ keepExistingData: false });
    await fileStream.write(JSON.stringify(data, null, 2));
    fileStream.close();
  }

  // ----------
  // async exportRender() {
  //   const { scene, camera, renderer, keyframes, maxTime } = this;

  //   const format = {
  //     extension: 'png',
  //     mimeType: 'image/png'
  //   };

  //   if (!keyframes.length) {
  //     return;
  //   }

  //   let startTime = 0;
  //   const fps = 30;
  //   const timePerFrame = 1000 / fps;
  //   const frameCount = Math.ceil(maxTime / timePerFrame);

  //   const directoryHandle = await window.showDirectoryPicker();

  //   for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
  //     const fileHandle = await directoryHandle.getFileHandle(
  //       `${pad(frameIndex + 1, 5)}.${format.extension}`,
  //       {
  //         create: true
  //       }
  //     );

  //     const writable = await fileHandle.createWritable();

  //     if (startTime === 0) {
  //       startTime = Date.now();
  //     }

  //     this.setCurrentTime(frameIndex * timePerFrame);
  //     renderer.render(scene, camera);

  //     const blob = await new Promise((resolve) => {
  //       return this.renderer.domElement.toBlob(resolve, format.mimeType, 0.8);
  //     });

  //     await writable.write(blob);
  //     await writable.close();
  //   }

  //   const time = Date.now() - startTime;
  //   const msPerFrame = time / frameCount;
  //   console.log(
  //     `exported ${frameCount} frames at ${viewWidth}x${viewHeight} in ${Math.round(
  //       msPerFrame
  //     )} ms/frame or ${Math.round(1000 / msPerFrame)} fps`
  //   );
  // }
}
