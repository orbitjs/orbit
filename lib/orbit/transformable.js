import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transform from './transform';
import { assert } from './lib/assert';
import { deprecate } from './lib/deprecate';

function settleTransform(transform) {
  this._transformLog[transform.id] = true;

  return this.settle.call(this, 'transform', transform);
}

function processTransform(transform) {
  // console.log('processTransform', this.id, transform);

  let response = this._transform(transform);

  if (response && response.then) {
    return response
      .then(() => {
        return settleTransform.call(this, transform);
      });
  }

  return settleTransform.call(this, transform);
}

function queueTransform(transform) {
  let _this = this;

  var action = this._transformQueue.push({
    data: transform,
    process: function() {
      return processTransform.call(_this, transform);
    }
  });

  return action.complete;
}

function queueTransformResult(transform) {
  let _this = this;

  var action = this._transformQueue.push({
    data: transform,
    process: function() {
      return settleTransform.call(_this, transform);
    }
  });

  return action.complete;
}

export default {
  init() {
    this._super(...arguments);

    Evented.extend(this);
    this._transformQueue = new ActionQueue();
    this._transformLog = {};
  },

  transformed(transform) {
    if (!(transform instanceof Transform)) {
      transform = new Transform(transform);
    }

    // console.log('transformed - queued', this.id, transform);
    return queueTransformResult.call(this, transform);
  },

  transform(transform) {
    if (transform instanceof Transform) {
      // Do not reapply transforms that have been applied
      if (this._transformLog[transform.id]) { return; }
    } else {
      // If a transform was not passed in, create a new one from the
      // arguments
      transform = new Transform(transform);
    }

    // console.log('transform - queued', this.id, transform);
    return queueTransform.call(this, transform);
  },

  settleTransforms() {
    return this._transformQueue.process();
  },

  clearTransformLog() {
    this._transformLog = {};
  }
};
