import { Class } from 'orbit/lib/objects';
import Evented from 'orbit/evented';
import ActionQueue from 'orbit/action-queue';

export default Class.extend({
  init() {
    Evented.extend(this);
    this._transforms = new ActionQueue();
  },

  add(transform) {
    this._transforms.push({
      process: () => this.resolve('transform', transform)
    });
  }
});
