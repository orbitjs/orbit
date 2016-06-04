import ActionQueue from 'orbit/action-queue';

export default class TransformQueue {
  constructor() {
    this._transforms = new ActionQueue();
  }

  add(transform) {
    this._transforms.push({
      process: () => this.resolve('transform', transform)
    });
  }
}
