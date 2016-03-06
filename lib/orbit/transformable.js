import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transform from './transform';
import { assert } from './lib/assert';
import { deprecate } from './lib/deprecate';
import { TransformBuilderNotRegisteredException } from './lib/exceptions';

function queueTransform(transform) {
  // console.log(`${this.id}:queue`, transform.id);

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
      this._transformLog[transform.id] = true;
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

    this._transformLog = {};
  },

  transformed(transform) {
    if (!(transform instanceof Transform)) {
      transform = new Transform(transform);
    }

    // console.log(`${this.id}:transformed`, transform.id);

    return queueTransformed.call(this, transform);
  },

  transform(_transform) {
    let transform = _transform;

    if (typeof transform === 'function') {
      if (this.transformBuilder) {
        transform = this.transformBuilder.build(transform);
      } else {
        throw new TransformBuilderNotRegisteredException();
      }
    }

    if (transform instanceof Transform) {
      // Do not reapply transforms that have been applied
      if (this._transformLog[transform.id]) { return; }
    } else {
      // If a Transform was not passed in, create a new one from the arguments
      transform = new Transform(transform);
    }
    // console.log(`${this.id}:transform`, transform.id);

    return queueTransform.call(this, transform);
  },

  settleTransforms() {
    // console.log(`${this.id}:settleTransforms`);
    return this._transformQueue.process();
  },

  clearTransformLog() {
    this._transformLog = {};
  }
};
