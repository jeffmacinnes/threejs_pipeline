import { clipPath, makeClipPoly } from '../utils/animationUtils.js';

export default class Titles {
  constructor(config) {
    this.config = config;
    this.titles = this.config.titles;
    this.prepContainer();

    // create containers for each title component
    this.hedDiv = this.createTitleComponent('hed', this.titles.HED);
    this.dekDiv = this.createTitleComponent('dek', this.titles.DEK);

    // --- Build Animation Timeline
    this.buildDuration = 3;
    this.masterTL = gsap.timeline();
    this.masterTL
      .add('tl-start') // add a tag at start, buildIn is relative to start
      .add('buildIn', 'tl-start+=1')
      .add(this.getRevealInTL(this.hedDiv), 'buildIn')
      .add(this.getRevealInTL(this.dekDiv), 'buildIn')
      .add('tl-end', `tl-start+=${this.config.duration}`) // add a tag at end, buildOut is relative to end
      .add('buildOut', `tl-end-=${this.buildDuration}`)
      .add(this.getRevealOutTL(this.hedDiv), 'buildOut')
      .add(this.getRevealOutTL(this.dekDiv), 'buildOut');

    // init scene
    this.init();
  }

  prepContainer() {
    let div = document.createElement('div');
    div.id = 'titles-container';
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.pointerEvents = 'none';
    this.titlesContainer = div;
    this.config.rootDiv.appendChild(div);
  }

  createTitleComponent(cmpName, txt) {
    /* create div for one of the title components (e.g. hed, annotation, etc)
      'cmpName' should be one of 'hed', 'dek', 'source', 'label'
    */
    let div = document.createElement('div');
    div.id = cmpName;
    div.classList.add(this.config.format);
    div.style.position = 'absolute';
    div.innerText = txt;
    this.titlesContainer.appendChild(div);
    return div;
  }

  init() {
    // init all clipPaths
    for (let div of [this.hedDiv, this.dekDiv]) {
      div.style.clipPath = makeClipPoly([...clipPath.hide_x0]);
    }

    // reset framecount
    this.frameCount = 0;
  }

  update() {
    this.frameCount++;
    let progressPCT = this.frameCount / this.config.totalFrames;

    // update progress on master timeline
    this.masterTL.progress(progressPCT, true).pause(); // suppress events
  }

  // --- ANIMATION TIMELINES
  getRevealInTL(el) {
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { 'clip-path': makeClipPoly([...clipPath.hide_x0]) },
      { 'clip-path': makeClipPoly([...clipPath.show]), duration: this.buildDuration }
    );
    return tl;
  }

  getRevealOutTL(el) {
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { 'clip-path': makeClipPoly([...clipPath.show]) },
      { 'clip-path': makeClipPoly([...clipPath.hide_x0]), duration: this.buildDuration }
    );
    return tl;
  }
}
