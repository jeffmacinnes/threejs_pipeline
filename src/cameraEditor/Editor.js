import _ from 'lodash';
import EditorCurves from './EditorCurves.js';
import EditorControls from './EditorControls.js';

export default {
  components: {
    EditorCurves,
    EditorControls
  },

  props: ['world'],

  data() {
    return {
      playing: false,
      frameIndex: 0,
      keyframes: [],
      selectedKeyframeId: 0,
      frameCount: 0,
      showCurves: false
    };
  },

  mounted() {
    this.world.on('frameIndexChange', (frameIndex) => {
      this.frameIndex = frameIndex;
    });

    this.world.on('playingChange', (playing) => {
      this.playing = playing;
    });

    this.world.on('keyframesChange', (value, frameCount) => {
      this.keyframes = _.cloneDeep(value);
      this.frameCount = frameCount;
    });

    this.world.on('selectedKeyframeIdChange', (value) => {
      this.selectedKeyframeId = value;
    });
  },

  methods: {
    toggleCurves() {
      this.showCurves = !this.showCurves;
    }
  },

  template: `
    <EditorCurves v-if="showCurves" :keyframes="keyframes" :world="world" />
    <EditorControls :playing="playing" :frameIndex="frameIndex" :keyframes="keyframes" :selectedKeyframeId="selectedKeyframeId" :frameCount="frameCount" :world="world" @toggleCurves="toggleCurves" />
  `
};
