import Orbit from 'orbit/main';
import Evented from 'orbit/evented';
import ActionQueue from 'orbit/action_queue';

var normalizeOperation = function(op) {
  if (typeof op.path === 'string') op.path = op.path.split('/');
};

var settleTransformEvents = function(ops) {
  var _this = this;

  return new Orbit.Promise(function(resolve) {
    var settleEach = function() {
      if (ops.length === 0) {
        resolve();

      } else {
        var op = ops.shift();

//TODO-log        console.log(_this.id, ops.length + 1, 'didTransform', op[0], op[1]);

        var response = _this.settle.call(_this, 'didTransform', op[0], op[1]);

        if (response) {
          return response.then(
            function(success) {
              settleEach();
            },
            function(error) {
              settleEach();
            }
          );
        } else {
          settleEach();
        }
      }
    };

    settleEach();
  });
};

var transformOne = function(operation) {
  var _this = this;

  normalizeOperation(operation);

  return _this.transformQueue.push(operation).then(
    function(result) {
      if (_this._completedTransforms.length > 0) {
        return settleTransformEvents.call(_this, _this._completedTransforms).then(
          function() {
            return result;
          }
        );
      } else {
        return result;
      }
    }
  );
};

var transformMany = function(operations) {
  var _this = this,
      inverses = [],
      ret;

  operations.forEach(function(operation) {

    normalizeOperation(operation);

    ret = _this.transformQueue.push(operation).then(
      function(inverse) {
        if (_this._completedTransforms.length > 0) {
          return settleTransformEvents.call(_this, _this._completedTransforms).then(
            function() {
              inverses = inverses.concat(inverse);
            }
          );
        } else {
          inverses = inverses.concat(inverse);
        }
      }
    );
  });

  return ret.then( function() { return inverses; } );
};

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object.transformQueue = new ActionQueue(object._transform, object);
      object._completedTransforms = [];

      Evented.extend(object);

      object.didTransform = function(operation, inverse) {
        object._completedTransforms.push([operation, inverse]);
      };

      object.transform = function(operation) {
        Orbit.assert('_transform must be defined', object._transform);

        if (Object.prototype.toString.call(operation) === '[object Array]') {
          return transformMany.call(object, operation);
        } else {
          return transformOne.call(object, operation);
        }
      };
    }
    return object;
  }
};

export default Transformable;