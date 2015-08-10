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

function settleTransformation(transformation) {
  var _this = this;

  if (transformation.result === undefined) {
    return;

  } else if (transformation.result.then) {
    return transformation.result.then(function(result2) {
      transformation.result = result2;
      return settleTransformation.call(_this, transformation);
    });

  } else {
    addActiveTransformation.call(_this, transformation);

    return this.settle.call(_this, 'didTransform', transformation).then(function() {
      removeActiveTransformation.call(_this, transformation);
      return transformation.result;
    });
  }
}

function processTransformation(transformation) {
  // console.log('processTransform', this.id, transform, result);

  if (transformation.result === undefined) {
    var ops = transformation.operations;

    if (this._prepareTransformOperations) {
      ops = this._prepareTransformOperations(ops);
    }

    if (ops.length === 0) return;

    transformation.result = this._transform(ops);
  }

  return settleTransformation.call(this, transformation);
}

function queueTransformation(transformation) {
  var _this = this;

  var action = this._transformationQueue.push({
    data: transformation,
    process: function() {
      return processTransformation.call(_this, transformation);
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
        return this.applyTransformation( new Transformation(null, result) );
      };

      object.transform = function(operations) {
        return this.applyTransformation( new Transformation(operations) );
      };

      object.applyTransformation = function(transformation) {
        if (transformation.isActive()) {
          var activeTransformation = this._activeTransformations[this._activeTransformations.length - 1];

          if (activeTransformation && transformation.relatedTo(activeTransformation)) {
            // console.log('applyTransform - skipped the queue', this.id, transform);
            return processTransformation.call(this, transformation);
          }
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
