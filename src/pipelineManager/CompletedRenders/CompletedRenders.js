import CompletedItem from './CompletedItem.js';

export default class CompletedRenders {
  constructor() {
    this.crDiv = document.querySelector('#completed-renders-container');
    this.completed = [];
  }

  update(completedScenes) {
    let currentIDs = this.completed.map((d) => d.id);
    completedScenes.forEach((scene) => {
      let { id } = scene;
      // add completedItem for each scene not already present in this.completed
      if (!currentIDs.includes(id)) {
        let completedItem = new CompletedItem(scene);
        this.crDiv.appendChild(completedItem.div);
        this.completed.push(completedItem);
      }
    });

    // remove any completedItems that are no longer in the completed scenes list
    let completedIds = completedScenes.map((d) => d.id);
    let completedItemsToRemove = this.completed.filter((d) => !completedIds.includes(d.id));
    completedItemsToRemove.forEach((completedItem) => {
      completedItem.clearTimer();
      completedItem.div.remove();
    });

    // update list
    this.completed = this.completed.filter((d) => completedIds.includes(d.id));
  }

  clearCompleted() {
    // stop the timers first
    this.completed.forEach((completedItem) => {
      completedItem.clearTimer();
    });
    this.completed = [];
  }
}
