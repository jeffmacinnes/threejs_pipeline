export default class FormatOpt {
  constructor(scene, format) {
    this.scene = scene;
    this.format = format;
    this.isSelected = false;

    this.div = document.createElement('div');
    this.div.classList.add('format-option');
    this.div.innerText = this.format;

    this.div.onclick = () => {
      // toggle isSelected state
      this.isSelected = !this.isSelected;
      this.update();
    };
  }

  setSelected(value) {
    // set the selected state to value
    this.isSelected = value;
    this.update();
  }

  update() {
    if (this.isSelected) {
      // remove any exists selected class
      if (this.div.classList.contains('selected')) {
        this.div.classList.remove('selected');
      }
      // add selected class
      this.div.classList.add('selected');
    } else {
      if (this.div.classList.contains('selected')) {
        this.div.classList.remove('selected');
      }
    }
  }
}
