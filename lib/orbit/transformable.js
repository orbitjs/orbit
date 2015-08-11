import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transformation from './transformation';
import { deprecate } from './lib/deprecate';

function addActiveTransformation(transformation) {
  this._activeTransformations.push(transformation);
}

function removeActiveTransformation(transformation) {
  var idx = this._activeTransformations.indexOf(transformation);
  if (idx > -1) this._activeTransformations.splice(idx, 1);
}

function settleTransformation(transformation, result) {
  var _this = this;

  if (result === undefined) {
    return;

  } else if (result.then) {
    return result.then(function(result2) {
      return settleTransformation.call(_this, transformation, result2);
    });

  } else {
    addActiveTransformation.call(_this, transformation);

    return this.settle.call(_this, 'didTransform', transformation, result).then(function() {
      removeActiveTransformation.call(_this, transformation);
      return result;
    });
  }
}

function processTransformation(transformation) {
  // console.log('processTransform', this.id, transform, result);

  var ops = transformation.operations;

  if (this.prepareTransformOperations) {
    ops = this.prepareTransformOperations(ops);
  }

  if (ops.length === 0) return;

  var result = this._transform(ops);

  return settleTransformation.call(this, transformation, result);
}

function processTransformResult(result) {
  // Create a new empty transformation to associate with this result.
  var transformation = new Transformation();

  return settleTransformation.call(this, transformation, result);
}

function queueTransformation(transformation) {
  var _this = this;

  var action = this._transformationQueue.push({
    process: function() {
      return processTransformation.call(_this, transformation);
    }
  });

  return action.complete;
}

function queueTransformResult(result) {
  var _this = this;

  var action = this._transformationQueue.push({
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
      object._transformationQueue = new ActionQueue();
      object._activeTransformations = [];

      Evented.extend(object);

      object.didTransform = function() {
        Orbit.deprecate('`didTransform` has been deprecated. Please call `transformed` instead and supply a TransformResult as an argument.', true);
      };

      object.transformed = function(result) {
        return queueTransformResult.call(this, result);
      };

      object.transform = function(transformation) {
        if (transformation instanceof Transformation) {
          // Determine if the transformation is related to the active
          // transformation. If so, skip the queue and process immediately.

          var activeTransformation = this._activeTransformations[this._activeTransformations.length - 1];

          if (activeTransformation && transformation.relatedTo(activeTransformation)) {
            // console.log('applyTransform - skipped the queue', this.id, transform);
            return processTransformation.call(this, transformation);
          }

        } else {
          // If a transformation was not passed in, create a new one from the
          // arguments
          transformation = new Transformation(transformation);
        }

        // console.log('applyTransform - queued', this.id, transform);
        return queueTransformation.call(this, transformation);
      };

      object.settleTransforms = function() {
        return this._transformationQueue.process();
      };
    }

    return object;
  }
};

export default Transformable;
