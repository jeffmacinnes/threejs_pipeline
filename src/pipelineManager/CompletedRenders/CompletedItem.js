export default class CompletedItem {
  constructor(scene) {
    this.id = scene.id;
    this.scene = scene.scene;
    this.format = scene.format;
    this.completedAt = scene.completedAt;

    // create DOM elements for this completed item
    this.prepDOM();

    // start timers
    this.elapsedTimer = setInterval(this.updateElapsedTimer.bind(this), 10000);
  }

  prepDOM() {
    this.div = document.createElement('div');
    this.div.classList.add('completed-item');

    // title
    let title = document.createElement('div');
    title.classList.add('completed-title');
    title.innerHTML = `<span>${this.scene}</span> ${this.format}`;
    this.div.appendChild(title);

    // elapsed
    this.elapsedLabel = document.createElement('div');
    this.elapsedLabel.classList.add('completed-elapsed');
    this.elapsedLabel.innerHTML = `0s ago`;
    this.div.appendChild(this.elapsedLabel);
  }

  updateElapsedTimer() {
    let elapsedSec = ((new Date().getTime() - this.completedAt) / 1000).toFixed(0);
    if (elapsedSec < 60) {
      this.elapsedLabel.innerHTML = `${elapsedSec}s ago`;
    } else {
      let min = Math.floor(elapsedSec / 60);
      let sec = elapsedSec % 60;
      this.elapsedLabel.innerHTML = `${min}m ${sec}s ago`;
    }
  }

  clearTimer() {
    clearInterval(this.elapsedTimer);
  }
}
