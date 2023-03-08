import FormatOpt from './FormatOpt.js';

export default class SceneChooser {
  constructor(socket, scenes) {
    this.socket = socket;
    this.scenes = scenes;

    this.opts = []; //

    // prep dom
    this.prepDom();
  }

  prepDom() {
    this.scDiv = document.querySelector('#scene-chooser-container');

    // -- select opts container
    let selectOptsDiv = document.createElement('div');
    selectOptsDiv.id = 'selection-options-container';

    let selectAllDiv = document.createElement('div');
    selectAllDiv.classList.add('selection-option');
    selectAllDiv.innerText = 'select all';
    selectAllDiv.onclick = this.handleSelectAll.bind(this);
    selectOptsDiv.appendChild(selectAllDiv);

    let deselectAllDiv = document.createElement('div');
    deselectAllDiv.classList.add('selection-option');
    deselectAllDiv.innerText = 'deselect all';
    deselectAllDiv.onclick = this.handleDeselectAll.bind(this);
    selectOptsDiv.appendChild(deselectAllDiv);

    this.scDiv.appendChild(selectOptsDiv);

    // add container for each set of scene opts
    let allScenesContainer = document.createElement('div');
    allScenesContainer.id = 'all-scenes-container';
    this.scDiv.appendChild(allScenesContainer);

    this.scenes.forEach((scene) => {
      let { formats } = scene;
      let sceneOptsDiv = document.createElement('div');
      sceneOptsDiv.classList.add('scene-opts-container');

      // add button for each format;
      formats.forEach((fmt) => {
        let fmtOpt = new FormatOpt(scene.scene, fmt);
        sceneOptsDiv.appendChild(fmtOpt.div);
        this.opts.push(fmtOpt);
      });

      // scene label
      let sceneLabel = document.createElement('div');
      sceneLabel.classList.add('scene-label');
      sceneLabel.innerText = scene.scene;
      sceneOptsDiv.appendChild(sceneLabel);

      // add this scene opts div to scDiv
      allScenesContainer.appendChild(sceneOptsDiv);
    });

    // add control panel
    let controlDiv = document.createElement('div');
    controlDiv.id = 'scene-chooser-controls';
    let submitBtn = document.createElement('div');
    submitBtn.classList.add('control-button');
    submitBtn.innerText = 'submit';
    submitBtn.onclick = this.handleSubmit.bind(this);
    controlDiv.appendChild(submitBtn);

    this.scDiv.appendChild(controlDiv);
  }

  handleSubmit() {
    // get currently selected options
    let selectedOpts = this.opts
      .filter((opt) => opt.isSelected)
      .map((opt) => ({ scene: opt.scene, format: opt.format, totalFrames: 3600 }));

    // send selected scenes to server
    this.socket.emit('render-scenes', { scenes: selectedOpts });

    // deselect all options
    this.handleDeselectAll();
  }

  handleSelectAll() {
    // select all of the options
    this.opts.forEach((opt) => {
      opt.setSelected(true);
    });
  }

  handleDeselectAll() {
    // select all of the options
    this.opts.forEach((opt) => {
      opt.setSelected(false);
    });
  }
}
