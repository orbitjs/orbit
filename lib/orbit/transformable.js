import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transform from './transform';
import TransformLog from './transform-log';
import { assert } from './lib/assert';
import { deprecate } from './lib/deprecate';

function queueTransform(transform) {
  console.log(`${this.id}:queue`, transform.id);

  let action = this._transformQueue.push({
    process: () =>
      Orbit.Promise
        .resolve(this._transform(transform))
        // .tap(() => console.log(`${this.id}:process`, transform.id))
        .then(() => this._transformedQueue.process())
  });

  return action.complete;
}

function queueTransformed(transform) {
  // console.log(`${this.id}:queueTransformed`, transform.id);

  let action = this._transformedQueue.push({
    process: () => {
      this._transformLog.append(transform.id);
      return this.settle('transform', transform);
    }
  });

  return action.complete;
}

export default {
  init() {
    this._super(...arguments);

    Evented.extend(this);

    this._transformQueue = new ActionQueue();
    this._transformedQueue = new ActionQueue();

    this._transformLog = new TransformLog();
  },

  transformed(transform) {
    if (!(transform instanceof Transform)) {
      transform = new Transform(transform);
    }

    // console.log(`${this.id}:transformed`, transform.id);

    return queueTransformed.call(this, transform);
  },

  transform(transform) {
    if (transform instanceof Transform) {
      // Do not reapply transforms that have been applied
      if (this._transformLog.contains(transform.id)) { return; }
    } else {
      // If a transform was not passed in, create a new one from the
      // arguments
      transform = new Transform(transform);
    }
    // console.log(`${this.id}:transform`, transform.id);

    return queueTransform.call(this, transform);
  },

  contains(transform) {
    return this._transformLog.contains(transform.id);
  },

  settleTransforms() {
    // console.log(`${this.id}:settleTransforms`);
    return this._transformQueue.process();
  },

  clearTransformLog() {
    this._transformLog.clear();
  }
};
