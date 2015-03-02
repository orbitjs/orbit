import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transformation from './transformation';
import Operation from './operation';
import { isArray } from './lib/objects';
import { assert } from './lib/assert';

function normalize(operation) {
  if (isArray(operation)) {
    return operation.map(function(o) {
      return normalize(o);
    });

  } else {
    if (operation instanceof Operation) {
      return operation;
    } else {
      return new Operation(operation);
    }
  }
}

function transformationFor(operation) {
  var transformation;
  var i;

  if (isArray(operation)) {
    for (i = 0; i < operation.length; i++) {
      var t = transformationFor.call(this, operation[i]);
      if (transformation) {
        if (t !== transformation) return;
      } else {
        transformation = t;
      }
    }
    return transformation;

  } else {
    var queue = this._transformationQueue.content;

    // console.log('transformationFor', operation, queue.length);

    for (i = 0; i < queue.length; i++) {
      transformation = queue[i].data;
      if (transformation.verifyOperation(operation)) {
        return transformation;
      }
    }
  }
}

function queueTransformation(transformation) {
  var _this = this;

  var processor = this._transformationQueue.push({
    data: transformation,
    process: function() {
      return transformation.process();
    }
  });

  return processor;
}

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object._transformationQueue = new ActionQueue();

      Evented.extend(object);

      object.didTransform = function(operation, inverse) {
        var normalized = normalize(operation);
        var transformation = transformationFor.call(this, normalized);
        if (transformation) {
          // console.log('Transformable#didTransform - matching transformation found', this.id, normalized, inverse);
          transformation.pushCompletedOperation(normalized, inverse);

        } else {
          // console.log('Transformable#didTransform - createTransformation', this.id, normalized, inverse);
          transformation = new Transformation(this);
          transformation.pushCompletedOperation(normalized, inverse);
          queueTransformation.call(this, transformation);
        }
      };

      object.currentTransformation = function() {
        if (this._transformationQueue.current) return this._transformationQueue.current.data;
      };

      object.transform = function(operation) {
        var normalized = normalize(operation);
        var transformation = transformationFor.call(this, normalized);
        var action;

        if (transformation) {
          // console.log('transform - matching transformation found', this.id, normalized);
          action = transformation.pushOperation(normalized);

          if (isArray(action)) {
            return action[action.length - 1].complete;
          } else {
            return action.complete;
          }

        } else {
          // console.log('transform - createTransformation', this.id, normalized);
          transformation = new Transformation(this);
          action = transformation.pushOperation(normalized);
          var transformationProcessor = queueTransformation.call(this, transformation);
          return transformationProcessor.complete;
        }
      };

      object.settleTransforms = function() {
        return this._transformationQueue.process();
      };
    }

    return object;
  }
};

export default Transformable;
