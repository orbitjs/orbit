import Evented from 'orbit/evented';
import ActionQueue from 'orbit/action-queue';

export default class TransformQueue {
  constructor() {
    Evented.extend(this);
    this._transforms = new ActionQueue();
  }

  add(transform) {
    this._transforms.push({
      process: () => this.resolve('transform', transform)
    });
  }
}
