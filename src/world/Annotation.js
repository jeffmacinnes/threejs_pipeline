// Class for showing and animating an annotation on the scene
// This annotation places text in HTML ON TOP OF scene (not within scene)!
export default class Annotation {
  constructor(rootDiv, format) {
    this.rootDiv = rootDiv; // div to attach the annotation to
    this.format = format; // the current screen format (important for applying the correct class)

    this.generate();

    // register animation effect
    gsap.registerEffect({
      name: 'swapText',
      effect: (targets, config) => {
        let tl = gsap.timeline();
        tl.to(targets, { opacity: 0, duration: config.duration / 2 });
        tl.add(() => (targets[0].innerText = config.text));
        tl.to(targets, { opacity: 1, duration: config.duration / 2 });
        return tl;
      },
      defaults: { duration: 0.0001 },
      extendTimeline: true
    });
  }

  setPosition(x, y) {
    // set the position of the CENTER of the annotation, as % of screen
    this.annotDiv.style.left = `${x * 100}%`;
    this.annotDiv.style.top = `${y * 100}%`;
  }

  setValue(value) {
    this.valueDiv.innerText = value;
  }

  setUnit(unit) {
    this.unitDiv.innerText = unit;
  }

  updateValue(newValue) {
    let tl = gsap.timeline();
    tl.swapText(this.valueDiv, { text: newValue });
  }

  updateUnit(newUnit) {
    let tl = gsap.timeline();
    tl.swapText(this.unitDiv, { text: newUnit });
  }

  generate() {
    // generate all the dom elements needed for an abs position annotation div
    let container = document.createElement('div');
    container.id = 'annotation-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    this.rootDiv.appendChild(container);

    this.annotDiv = document.createElement('div');
    this.annotDiv.id = 'annotation';
    this.annotDiv.classList.add(this.format);
    this.annotDiv.style.position = 'absolute';

    this.valueDiv = document.createElement('div');
    this.valueDiv.classList.add(this.format);
    this.valueDiv.id = 'annotation-value';
    this.valueDiv.innerText = '';

    this.unitDiv = document.createElement('div');
    this.unitDiv.classList.add(this.format);
    this.unitDiv.id = 'annotation-unit';
    this.unitDiv.innerText = '';

    this.annotDiv.appendChild(this.valueDiv);
    this.annotDiv.appendChild(this.unitDiv);
    container.appendChild(this.annotDiv);
  }
}
