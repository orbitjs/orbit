import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transform from './transform';
import TransformResult from './transform-result';
import { assert } from './lib/assert';
import { deprecate } from './lib/deprecate';

function settleTransform(transform, result) {
  var _this = this;

  this._transformLog[transform.id] = true;

  return this.settle.call(this, 'didTransform', transform, result)
    .then(function() {
      return result;
    });
}

function processTransform(transform) {
  // console.log('processTransform', this.id, transform);

  var _this = this;
  var ops = transform.operations;
  var result;

  if (this.prepareTransformOperations) {
    ops = this.prepareTransformOperations(ops);
  }

  if (ops.length > 0) {
    var response = this._transform(ops);

    if (response) {
      if (response.then) {
        return response.then(function(result) {
          return settleTransform.call(_this, transform, result);
        });
      } else {
        result = response;
      }
    }
  }

  if (!result) result = new TransformResult();

  return settleTransform.call(this, transform, result);
}

function queueTransform(transform) {
  var _this = this;

  var action = this._transformQueue.push({
    data: transform,
    process: function() {
      return processTransform.call(_this, transform);
    }
  });

  return action.complete;
}

function queueTransformResult(transform, result) {
  var _this = this;

  var action = this._transformQueue.push({
    data: transform,
    process: function() {
      return settleTransform.call(_this, transform, result);
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

  transformed(result) {
    assert('Call `transformed` with an instanceof a TransformResult.', result instanceof TransformResult);

    var transform = new Transform(result.operations);

    // console.log('transformed - queued', this.id, transform, result);
    return queueTransformResult.call(this, transform, result);
  },

  transform(transform) {
    if (transform instanceof Transform) {
      // Do not reapply transforms that have been applied
      if (this._transformLog[transform.id]) return;

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
