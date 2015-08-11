import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transform from './transform';
import { deprecate } from './lib/deprecate';

function addActiveTransform(transform) {
  this._activeTransforms.push(transform);
}

function removeActiveTransform(transform) {
  var idx = this._activeTransforms.indexOf(transform);
  if (idx > -1) this._activeTransforms.splice(idx, 1);
}

function settleTransform(transform, result) {
  var _this = this;

  if (result === undefined) {
    return;

  } else if (result.then) {
    return result.then(function(result2) {
      return settleTransform.call(_this, transform, result2);
    });

  } else {
    addActiveTransform.call(_this, transform);

    return this.settle.call(_this, 'didTransform', transform, result).then(function() {
      removeActiveTransform.call(_this, transform);
      return result;
    });
  }
}

function processTransform(transform) {
  // console.log('processTransform', this.id, transform, result);

  var ops = transform.operations;

  if (this.prepareTransformOperations) {
    ops = this.prepareTransformOperations(ops);
  }

  if (ops.length === 0) return;

  var result = this._transform(ops);

  return settleTransform.call(this, transform, result);
}

function processTransformResult(result) {
  // Create a new empty transform to associate with this result.
  var transform = new Transform();

  return settleTransform.call(this, transform, result);
}

function queueTransform(transform) {
  var _this = this;

  var action = this._transformQueue.push({
    process: function() {
      return processTransform.call(_this, transform);
    }
  });

  return action.complete;
}

function queueTransformResult(result) {
  var _this = this;

  var action = this._transformQueue.push({
    process: function() {
      return processTransformResult.call(_this, result);
    }
  });

  return action.complete;
}

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object._transformQueue = new ActionQueue();
      object._activeTransforms = [];

      Evented.extend(object);

      object.didTransform = function() {
        Orbit.deprecate('`didTransform` has been deprecated. Please call `transformed` instead and supply a TransformResult as an argument.', true);
      };

      object.transformed = function(result) {
        return queueTransformResult.call(this, result);
      };

      object.transform = function(transform) {
        if (transform instanceof Transform) {
          // Determine if the transform is related to the active
          // transform. If so, skip the queue and process immediately.

          var activeTransform = this._activeTransforms[this._activeTransforms.length - 1];

          if (activeTransform && transform.relatedTo(activeTransform)) {
            // console.log('applyTransform - skipped the queue', this.id, transform);
            return processTransform.call(this, transform);
          }

        } else {
          // If a transform was not passed in, create a new one from the
          // arguments
          transform = new Transform(transform);
        }

        // console.log('applyTransform - queued', this.id, transform);
        return queueTransform.call(this, transform);
      };

      object.settleTransforms = function() {
        return this._transformQueue.process();
      };
    }

    return object;
  }
};

export default Transformable;
