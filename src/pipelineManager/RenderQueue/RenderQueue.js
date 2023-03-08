import QueueItem from './QueueItem.js';

export default class RenderQueue {
  constructor() {
    // prep dom
    this.rqDiv = document.querySelector('#queue-items-container');
    this.queueItems = [];
  }

  // update the rendering queue items based on the given set of active scenes
  update(activeScenes) {
    let currentIDs = this.queueItems.map((d) => d.id);
    activeScenes.forEach((scene) => {
      let { id } = scene;
      // add queueItem for any new active scene
      if (!currentIDs.includes(id)) {
        let queueItem = new QueueItem(scene);
        this.rqDiv.appendChild(queueItem.div);
        this.queueItems.push(queueItem);
      }

      // update the queueItem for this scene
      let queueItem = this.queueItems.find((d) => d.id === scene.id);
      queueItem.update(scene);
    });

    // remove any queueItems that are no longer active
    let activeIDs = activeScenes.map((d) => d.id);
    let queueItemsToRemove = this.queueItems.filter((d) => !activeIDs.includes(d.id));
    queueItemsToRemove.forEach((queueItem) => {
      queueItem.clearTimers();
      queueItem.div.remove();
    });

    // update list
    this.queueItems = this.queueItems.filter((d) => activeIDs.includes(d.id));
  }
}
