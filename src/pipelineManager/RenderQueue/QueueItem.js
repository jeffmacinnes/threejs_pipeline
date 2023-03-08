export default class QueueItem {
  constructor(scene) {
    this.id = scene.id;
    this.scene = scene.scene;
    this.format = scene.format;
    this.state = scene.state;
    this.startedAt = scene.startedAt;
    this.completedAt = scene.completedAt;
    this.frames = scene.frames;
    this.clients = scene.clients;

    this.nCompletedFrames = this.frames.filter((d) => d).length;
    this.totalFrames = this.frames.length;
    this.runningTime = 0;
    this.pctComplete = 0;
    this.fps = 0;
    this.fpsIntervalStart = new Date().getTime();
    this.fpsCurrentFrameCount = 0;

    // create DOM elements for this queue item
    this.prepDom();

    // start timers
    this.runningTimeInterval = setInterval(this.updateRunningTime.bind(this), 1000);
    this.fpsInterval = setInterval(this.updateFPS.bind(this), 1000);
    // this.updateRunningTime();
  }

  prepDom() {
    this.div = document.createElement('div');
    this.div.classList.add('queue-item');

    // -- Rendering Status
    this.statusDiv = document.createElement('div');
    this.statusDiv.classList.add('status-label');
    this.div.appendChild(this.statusDiv);

    // -- Scene/Format Label
    let titleDiv = document.createElement('div');
    titleDiv.classList.add('title-container');
    let sceneLabel = document.createElement('div');
    sceneLabel.classList.add('title-label');
    sceneLabel.innerText = this.scene;
    let formatLabel = document.createElement('div');
    formatLabel.classList.add('title-label');
    formatLabel.innerText = this.format;

    titleDiv.appendChild(sceneLabel);
    titleDiv.appendChild(formatLabel);
    this.div.appendChild(titleDiv);

    // -- Frame Counter
    let frameCounterDiv = document.createElement('div');
    frameCounterDiv.classList.add('frame-counter-container');

    // text
    let frameTextDiv = document.createElement('div');
    frameTextDiv.classList.add('frame-text-container');
    this.countLabel = document.createElement('div');
    this.countLabel.classList.add('frame-count-label');
    this.pctLabel = document.createElement('div');
    this.pctLabel.classList.add('frame-pct-label');
    frameTextDiv.appendChild(this.countLabel);
    frameTextDiv.appendChild(this.pctLabel);
    frameCounterDiv.appendChild(frameTextDiv);

    // progress bar
    let progressDiv = document.createElement('div');
    progressDiv.classList.add('progress-container');
    this.progressMeter = document.createElement('span');
    this.progressMeter.style.width = '0%';
    progressDiv.appendChild(this.progressMeter);
    frameCounterDiv.appendChild(progressDiv);

    this.div.appendChild(frameCounterDiv);

    // time and fps
    let bottomTextDiv = document.createElement('div');
    bottomTextDiv.classList.add('bottom-text-container');
    this.runtimeLabel = document.createElement('div');
    this.runtimeLabel.classList.add('bottom-label');
    this.runtimeLabel.innerHTML = `<span>Run time:</span> --`;
    this.fpsLabel = document.createElement('div');
    this.fpsLabel.classList.add('bottom-label');
    this.fpsLabel.innerHTML = `<span>fps:</span> 0`;
    bottomTextDiv.appendChild(this.runtimeLabel);
    bottomTextDiv.appendChild(this.fpsLabel);

    this.div.appendChild(bottomTextDiv);
  }

  update(scene) {
    let { frames, state, clients, startedAt, completedAt } = scene;
    this.frames = frames;
    this.totalFrames = this.frames.length;
    this.state = state;
    this.clients = clients;
    this.startedAt = startedAt;
    this.completedAt = completedAt;

    // update metrics
    this.nCompletedFrames = this.frames.filter((d) => d).length;
    this.pctComplete = ((this.nCompletedFrames / this.totalFrames) * 100).toFixed(0);

    // update DOM
    let statusMsg;
    if (state === 'rendering') {
      statusMsg =
        this.clients.length > 1
          ? `${state} - ${this.clients.length} clients`
          : `${state} - ${this.clients.length} client`;
    } else {
      statusMsg = state;
    }
    this.statusDiv.innerText = statusMsg;
    this.countLabel.innerText = `${this.nCompletedFrames} of ${this.totalFrames}`;
    this.pctLabel.innerText = `${this.pctComplete}%`;
    this.progressMeter.style.width = `${this.pctComplete}%`;

    if (state === 'queued') {
      if (!this.div.classList.contains('queued')) {
        this.div.classList.add('queued');
      }
    } else {
      this.div.classList.remove('queued');
    }
  }

  clearTimers() {
    console.log('clearing queue item timer');
    clearInterval(this.runningTimeInterval);
    clearInterval(this.fpsInterval);
  }

  updateRunningTime() {
    // only calculate while running
    if (this.startedAt && !this.completedAt) {
      let elapsedSec = ((new Date().getTime() - this.startedAt) / 1000).toFixed(0);
      if (elapsedSec < 60) {
        this.runtimeLabel.innerHTML = `<span>Run time:</span> ${elapsedSec}s`;
      } else {
        let min = Math.floor(elapsedSec / 60);
        let sec = elapsedSec % 60;
        this.runtimeLabel.innerHTML = `<span>Run time:</span> ${min}m ${sec}s`;
      }
    }
  }

  updateFPS() {
    // only update while state is 'rendering'
    if (this.state === 'rendering') {
      let elapsed = (new Date().getTime() - this.fpsIntervalStart) / 1000;
      let nFrames = this.nCompletedFrames - this.fpsCurrentFrameCount;
      this.fps = nFrames / elapsed;
      this.fpsLabel.innerHTML = `<span>fps:</span> ${this.fps.toFixed(1)}`;

      // update interval baselines
      this.fpsIntervalStart = new Date().getTime();
      this.fpsCurrentFrameCount = this.nCompletedFrames;
    }
  }
}
