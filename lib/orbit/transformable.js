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

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object._transformQueue = new ActionQueue();
      object._transformLog = {};

      Evented.extend(object);

      object.didTransform = function() {
        deprecate('`didTransform` has been deprecated. Please call `transformed` instead and supply a TransformResult as an argument.', true);
      };

      object.transformed = function(result) {
        assert('Call `transformed` with an instanceof a TransformResult.', result instanceof TransformResult);

        var transform = new Transform(result.operations);

        // console.log('transformed - queued', this.id, transform, result);
        return queueTransformResult.call(this, transform, result);
      };

      object.transform = function(transform) {
        if (transform instanceof Transform) {
          // Do not reapply transforms that have been applied
          if (object._transformLog[transform.id]) return;

        } else {
          // If a transform was not passed in, create a new one from the
          // arguments
          transform = new Transform(transform);
        }

        // console.log('transform - queued', this.id, transform);
        return queueTransform.call(this, transform);
      };

      object.settleTransforms = function() {
        return this._transformQueue.process();
      };

      object.clearTransformLog = function() {
        this._transformLog = {};
      };
    }

    return object;
  }
};

export default Transformable;
