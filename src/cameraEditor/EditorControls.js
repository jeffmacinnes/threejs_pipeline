import _ from 'lodash';
import { MathUtils } from 'three';
import { pad } from '../utils/utils.js';

const frameBuffer = 300;

export default {
  props: ['playing', 'frameIndex', 'keyframes', 'selectedKeyframeId', 'frameCount', 'world'],

  data() {
    const fps = 60;
    const maxVisibleFrames = 60 * fps;
    const ticks = [];
    const tickFrames = 5 * fps;

    for (let i = tickFrames; i < maxVisibleFrames; i += tickFrames) {
      const percent = (i / maxVisibleFrames) * 100;
      ticks.push(percent);
    }

    return {
      drag: null,
      fps,
      maxVisibleFrames,
      ticks
    };
  },

  computed: {
    // ----------
    // maxVisibleFrames() {
    //   return 60 * this.fps; // Math.max(this.frameCount, this.frameIndex) + frameBuffer;
    // },

    // ----------
    secondsString() {
      return `${Math.floor(this.frameIndex / this.fps)}:${pad(this.frameIndex % this.fps, 2)}`;
    }
  },

  methods: {
    // ----------
    handleFramesClick() {
      const answer = prompt('Frames', this.frameIndex);
      if (answer === null) {
        return;
      }

      const frameIndex = parseInt(answer, 10);
      if (_.isFinite(frameIndex)) {
        this.world.setFrameIndex(frameIndex);
      }
    },

    // ----------
    handleSecondsClick() {
      const answer = prompt('Seconds:Frames', this.secondsString);
      if (answer === null) {
        return;
      }

      const parts = answer.split(':');
      const seconds = parseInt(parts[0], 10);
      const frames = parseInt(parts[1] || 0, 10);
      if (_.isFinite(seconds) && _.isFinite(frames)) {
        this.world.setFrameIndex(seconds * this.fps + frames);
      }
    },

    // ----------
    handlePlayClick() {
      this.world.setPlaying(!this.playing);
    },

    // ----------
    handleImportClick() {
      this.world.cameraController.import();
    },

    // ----------
    handleExportClick() {
      this.world.cameraController.export();
    },

    // ----------
    handleRenderClick() {
      // this.world.exportRender();
    },

    // ----------
    handleClearClick() {
      this.world.cameraController.clear();
    },

    // ----------
    handleCurvesClick() {
      this.$emit('toggleCurves');
    },

    // ----------
    handleTimeMouseDown(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      this.drag = {
        parentRect: rect
      };

      // Make sure even clicks work to move the playback head.
      this.handleTimeMouseMove(event);

      window.addEventListener('mousemove', this.handleTimeMouseMove);
      window.addEventListener('mouseup', this.handleTimeMouseUp);
    },

    // ----------
    handleTimeMouseMove(event) {
      if (!this.drag) {
        return;
      }

      const { parentRect } = this.drag;

      const frameIndex = Math.round(
        MathUtils.clamp(
          MathUtils.mapLinear(
            event.clientX,
            parentRect.left,
            parentRect.right,
            0,
            this.maxVisibleFrames
          ),
          0,
          this.maxVisibleFrames
        )
      );

      this.world.setFrameIndex(frameIndex);
    },

    // ----------
    handleTimeMouseUp() {
      window.removeEventListener('mousemove', this.handleTimeMouseMove);
      window.removeEventListener('mouseup', this.handleTimeMouseUp);

      this.drag = null;
    },

    // ----------
    handleKeyframeMouseDown(event, id) {
      const rect = event.currentTarget.parentNode.getBoundingClientRect();
      this.drag = {
        parentRect: rect
      };

      window.addEventListener('mousemove', this.handleKeyframeMouseMove);
      window.addEventListener('mouseup', this.handleKeyframeMouseUp);

      if (event.altKey) {
        this.world.cameraController.duplicateAndSelectKeyframeById(id);
      } else {
        this.world.cameraController.setSelectedKeyframeId(id);
      }
    },

    // ----------
    handleKeyframeMouseMove(event) {
      if (!this.drag) {
        return;
      }

      const { parentRect } = this.drag;

      const frameIndex = MathUtils.clamp(
        MathUtils.mapLinear(
          event.clientX,
          parentRect.left,
          parentRect.right,
          0,
          this.maxVisibleFrames
        ),
        0,
        this.maxVisibleFrames
      );

      this.world.cameraController.setKeyframeFrameIndex(this.selectedKeyframeId, frameIndex);
    },

    // ----------
    handleKeyframeMouseUp() {
      window.removeEventListener('mousemove', this.handleKeyframeMouseMove);
      window.removeEventListener('mouseup', this.handleKeyframeMouseUp);

      this.drag = null;
    }
  },

  watch: {},

  template: `
    <div class="controls">
      <div class="status">
        <button @click="handlePlayClick">{{playing ? 'Stop' : 'Play'}}</button>
        <button @click="handleImportClick">Import</button>
        <button @click="handleExportClick">Export</button>
        <!-- <button @click="handleRenderClick">Render</button> -->
        <button @click="handleClearClick">Clear</button> 
        <button @click="handleCurvesClick">Curves</button> 
        <div class="readouts">
          keyframes: {{keyframes.length}}, 
          <span class="clickable" @click="handleFramesClick">frames: {{frameIndex}}</span>,
          <span class="clickable" @click="handleSecondsClick">seconds: {{secondsString}}</span>
        </div>
      </div>
      <div class="timeline">
        <div class="label">Time</div>
        <div class="track" @mousedown="handleTimeMouseDown">
          <div class="tick" v-for="tick in ticks" :style="{ left: tick + '%' }"></div>
          <div class="time" :style="{ left: ((frameIndex / maxVisibleFrames) * 100) + '%' }" ></div>
        </div>
      </div>
      <div class="keyframes">
        <div class="label">Keyframes</div>
        <div class="track">
          <div class="keyframe" v-for="keyframe in keyframes" :style="{ left: ((keyframe.frameIndex / maxVisibleFrames) * 100) + '%', backgroundColor: selectedKeyframeId === keyframe.id ? '#0088FF' : '#FFFFFF' }" @mousedown="handleKeyframeMouseDown($event, keyframe.id)"></div>
        </div>
      </div>
    </div>
  `
};
