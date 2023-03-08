import _ from 'lodash';
import { MathUtils } from 'three';

const rowHeight = 90;
const buffer = 5;

const curveNames = [
  'xPositionCurve',
  'yPositionCurve',
  'zPositionCurve',
  'xTargetCurve',
  'yTargetCurve',
  'zTargetCurve'
];

export default {
  props: ['world', 'keyframes'],

  data() {
    const fps = 60;
    const maxVisibleFrames = 60 * fps;
    const ticks = [];
    const tickFrames = 5 * fps;
    const startX = 50;
    const endX = 990;

    for (let i = tickFrames; i < maxVisibleFrames; i += tickFrames) {
      const x = MathUtils.mapLinear(i, 0, maxVisibleFrames, startX, endX);
      ticks.push(x);
    }

    return { ticks, startX, endX, maxVisibleFrames };
  },

  mounted() {},

  computed: {
    rows() {
      // We're just referencing keyframes here so this computed value updates when it changes.
      const dummy = this.keyframes.length;

      const rows = [];
      let startY = 0;

      for (const name of curveNames) {
        const curve = this.world.cameraController[name];
        if (curve.points.length < 3) {
          continue;
        }

        const points = curve.getPoints(100);
        let minY = Infinity;
        let maxY = -Infinity;
        for (const point of points) {
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        }

        const startX = MathUtils.mapLinear(
          curve.points[0].x,
          0,
          this.maxVisibleFrames,
          this.startX,
          this.endX
        );

        const endX = MathUtils.mapLinear(
          curve.points[curve.points.length - 1].x,
          0,
          this.maxVisibleFrames,
          this.startX,
          this.endX
        );

        let path = '';
        const count = 500;
        for (let i = 0; i <= count; i++) {
          const factor = i / count;

          const x = MathUtils.mapLinear(i, 0, count, startX, endX);
          const y = MathUtils.mapLinear(
            curve.getPointAt(factor).y,
            minY,
            maxY,
            startY + buffer,
            startY + (rowHeight - buffer)
          );

          if (!path) {
            path += `M${x},${y} `;
          } else {
            path += `L${x},${y} `;
          }
        }

        rows.push({
          path,
          label: name,
          labelX: 10,
          labelY: startY + rowHeight / 2
        });

        startY += rowHeight;
      }

      return rows;
    },

    // ----------
    dots() {
      // We're just referencing keyframes here so this computed value updates when it changes.
      const dummy = this.keyframes.length;

      const dots = [];
      let startY = 0;

      for (const name of curveNames) {
        const curve = this.world.cameraController[name];
        if (curve.points.length < 3) {
          continue;
        }

        const points = curve.getPoints(100);
        let minY = Infinity;
        let maxY = -Infinity;
        for (const point of points) {
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        }

        for (const point of curve.points) {
          const x = MathUtils.mapLinear(point.x, 0, this.maxVisibleFrames, this.startX, this.endX);
          const y = MathUtils.mapLinear(
            point.y,
            minY,
            maxY,
            startY + buffer,
            startY + (rowHeight - buffer)
          );

          dots.push({ x, y });
        }

        startY += rowHeight;
      }

      return dots;
    }
  },

  methods: {},

  watch: {},

  template: `
    <div class="curves">
      <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
        <path v-for="row in rows" fill="none" stroke="#ff0" :d="row.path" />
        <text v-for="row in rows" fill="#ff0" font-size="7" opacity="0.5" :x="row.labelX" :y="row.labelY">{{row.label}}</text>
        <line v-for="tick in ticks" fill="none" stroke="#ff0" stroke-width="0.1" opacity="0.5" :x1="tick" :y1="10" :x2="tick" :y2="540" />
        <circle v-for="dot in dots" fill="#ff0" r="2" :cx="dot.x" :cy="dot.y" />
      </svg>
    </div>
  `
};
