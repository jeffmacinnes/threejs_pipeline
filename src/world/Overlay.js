// Overlay class for the HTML layer that sits on top of the THREE scene, with titles etc
import { clipPath, makeClipPoly } from '../utils/animationUtils.js';

export default class Overlay {
  constructor(config) {
    this.config = config;
    this.titles = this.config.titles;
    this.legend = this.config.legend;

    this.sourceLabel = this.titles.source.includes(',') ? 'Sources' : 'Source';

    // subcomponent text
    this.HED_text = this.config.titles.HED;
    this.DEK_text = this.config.titles.DEK;
    this.source_text = this.config.titles.source;
    this.units_text = this.config.titles.units;

    this.currentValue = null;
    this.currentYear = null;

    this.prepDOM();

    // -- Build Animation TL
    this.fadeDuration = 1;
    this.buildDuration = 3;
    this.overlayTL = gsap.timeline();
    this.overlayTL
      .add('tl-start') // add a tag at start of scene
      .add(this.getFadeOutTL(this.curtainNode), 'tl-start')
      .add('buildIn', 'tl-start+=2')
      .add(this.getRevealInTL(this.hedMiddleNode), 'buildIn')
      .add(this.getRevealInTL(this.dekMiddleNode), 'buildIn')
      .add(this.getRevealInTL(this.auxMiddleNode), 'buildIn')
      .add(this.getRevealInTL(this.yearMiddleNode), 'buildIn')
      .add('tl-end', `tl-start+=${this.config.duration}`) // add a tag at end, buildOut is relative to end
      .add('buildOut', `tl-end-=5`) // add tag for when to start the buildOut
      .add(this.getRevealOutTL(this.hedMiddleNode), 'buildOut')
      .add(this.getRevealOutTL(this.dekMiddleNode), 'buildOut')
      .add(this.getRevealOutTL(this.auxMiddleNode), 'buildOut')
      .add(this.getRevealOutTL(this.yearMiddleNode), 'buildOut')
      .add(this.getFadeInTL(this.curtainNode), `tl-end-=${this.fadeDuration}`);

    this.overlayTL.pause();

    // init the overlay
    this.init();
  }

  init() {
    // reset dynamic values
    this.updateAuxValue(null);
    this.updateYear(null);

    // init all animation widths
    for (let div of [
      this.hedMiddleNode,
      this.dekMiddleNode,
      this.auxMiddleNode,
      this.yearMiddleNode
    ]) {
      div.style.width = '0%';
    }

    // reset framecount
    this.frameCount = 0;
  }

  update() {
    this.frameCount++;
    let progressPCT = this.frameCount / this.config.totalFrames;
    this.overlayTL.progress(progressPCT, true).pause(); // suppress events

    this.updateYearSize();
  }

  updateAuxValue(value) {
    this.currentValue = value;
    this.valueNode.innerText = this.currentValue;

    if (this.currentValue) {
      this.valueContainer.style.visibility = 'visible';
    }
  }

  updateYear(year) {
    this.currentYear = year;
    this.yearInnerNode.innerText = this.currentYear;

    if (this.currentYear) {
      this.yearInnerNode.style.visibility = 'visible';
    }

    // call this every frame to fix a jitter issue that came up with the pipeline
    // rendering being split across multiple clients
    this.updateYearSize();
  }

  prepDOM() {
    /* Create the overlay container and sub elements for different overlay
    components. Most styles and layout will be handled in styles/overlay.css
    */
    // CURTAIN (covers full screen, fades in/out from black)
    this.curtainNode = document.createElement('div');
    this.curtainNode.id = 'curtain';
    this.curtainNode.style.position = 'absolute';
    this.curtainNode.style.width = '100%';
    this.curtainNode.style.height = '100%';
    this.curtainNode.style.top = 0;
    this.curtainNode.style.backgroundColor = '#000000';
    this.config.rootDiv.appendChild(this.curtainNode);

    // --- Overlay Container
    let container = document.createElement('div');
    container.id = 'overlay-container';
    container.classList.add(this.config.format);
    container.style.pointerEvents = 'none';
    this.config.rootDiv.appendChild(container); // append the container to root node

    // --- Subcomponents
    // HED (top left)
    this.hedNode = document.createElement('div');
    this.hedNode.id = 'hed';
    container.appendChild(this.hedNode);

    this.hedMiddleNode = document.createElement('div');
    this.hedMiddleNode.classList.add('overlay-middle');
    this.hedNode.appendChild(this.hedMiddleNode);

    this.hedInnerNode = document.createElement('div');
    this.hedInnerNode.classList.add('overlay-inner');
    this.hedInnerNode.innerHTML = this.HED_text;
    this.hedMiddleNode.appendChild(this.hedInnerNode);

    // dek (top right)
    this.dekNode = document.createElement('div');
    this.dekNode.id = 'dek';
    container.appendChild(this.dekNode);

    this.dekMiddleNode = document.createElement('div');
    this.dekMiddleNode.classList.add('overlay-middle');
    this.dekNode.appendChild(this.dekMiddleNode);

    this.dekInnerNode = document.createElement('div');
    this.dekInnerNode.classList.add('overlay-inner');
    this.dekInnerNode.innerHTML = this.DEK_text;
    this.dekMiddleNode.appendChild(this.dekInnerNode);

    // auxiliary info (bottom left; dynamic value, legend, source)
    this.auxNode = document.createElement('div');
    this.auxNode.id = 'aux-container';
    container.appendChild(this.auxNode);

    this.auxMiddleNode = document.createElement('div');
    this.auxMiddleNode.classList.add('overlay-middle');
    this.auxNode.appendChild(this.auxMiddleNode);

    this.auxInnerNode = document.createElement('div');
    this.auxInnerNode.classList.add('overlay-inner');
    this.auxMiddleNode.appendChild(this.auxInnerNode);

    // year (bottom right)
    this.yearNode = document.createElement('div');
    this.yearNode.id = 'year';
    container.appendChild(this.yearNode);

    this.yearMiddleNode = document.createElement('div');
    this.yearMiddleNode.classList.add('overlay-middle');
    this.yearNode.appendChild(this.yearMiddleNode);

    this.yearInnerNode = document.createElement('div');
    this.yearInnerNode.classList.add('overlay-inner');
    this.yearInnerNode.style.visibility = 'hidden'; // hide at first;
    this.yearMiddleNode.appendChild(this.yearInnerNode);

    // --- Add children to AUX container
    // current value
    this.valueContainer = document.createElement('div');
    this.valueContainer.id = 'value-container';
    this.valueContainer.style.visibility = 'hidden'; // hide at first;
    this.auxInnerNode.appendChild(this.valueContainer);

    let units = document.createElement('div');
    units.id = 'value-units';
    units.innerText = this.units_text;
    this.valueContainer.appendChild(units);

    this.valueNode = document.createElement('div');
    this.valueNode.id = 'value';
    this.valueContainer.appendChild(this.valueNode);

    // legend
    if (this.legend) {
      let legendNode = document.createElement('img');
      legendNode.id = 'legend';
      legendNode.src = this.legend;
      this.auxInnerNode.appendChild(legendNode);
    }

    // source
    let source = document.createElement('div');
    source.id = 'source';
    source.innerText = `${this.sourceLabel}: ${this.source_text}`;
    this.auxInnerNode.appendChild(source);

    // -- Add format as class to all elements
    let allNodes = [...container.querySelectorAll('*')];
    allNodes.forEach((node) => node.classList.add(this.config.format));

    // Preset sizes for animations
    let bounds = this.hedNode.getBoundingClientRect();
    this.hedInnerNode.style.width = `${bounds.width / this.config.rootScale}px`;

    bounds = this.dekNode.getBoundingClientRect();
    this.dekInnerNode.style.width = `${bounds.width / this.config.rootScale}px`;

    bounds = this.auxNode.getBoundingClientRect();
    this.auxInnerNode.style.width = `${bounds.width / this.config.rootScale}px`;

    this.updateYearSize();
  }

  updateYearSize() {
    this.yearInnerNode.style.width = 'auto';
    const bounds = this.yearNode.getBoundingClientRect();
    this.yearInnerNode.style.width = `${bounds.width / this.config.rootScale}px`;
  }

  // --- ANIMATION TIMELINES
  getRevealInTL(el) {
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { width: '0%' },
      {
        width: '100%',
        ease: 'power4.out',
        duration: this.buildDuration
      }
    );
    return tl;
  }

  getRevealOutTL(el) {
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { width: '100%' },
      {
        width: '0%',
        ease: 'power4.out',
        duration: this.buildDuration
      }
    );
    return tl;
  }

  getFadeInTL(el) {
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        ease: 'power4.in',
        duration: this.fadeDuration
      }
    );
    return tl;
  }

  getFadeOutTL(el) {
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { opacity: 1 },
      {
        opacity: 0,
        ease: 'power2.in',
        duration: this.fadeDuration
      }
    );
    return tl;
  }
}
