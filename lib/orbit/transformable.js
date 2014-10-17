import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import { assert } from './lib/assert';
import { isArray } from './lib/objects';

var normalizeOperation = function(op) {
  if (typeof op.path === 'string') op.path = op.path.split('/');
};

var transformOne = function(operation) {
  normalizeOperation(operation);

  if (this.settlingTransforms) {
    return applyTransform.call(this, operation);
  } else {
    return this.transformQueue.push(operation);
  }
};

var transformMany = function(operations) {
  var _this = this,
      inverses = [],
      ret;

  operations.forEach(function(operation) {
    ret = transformOne.call(_this, operation).then(
      function(inverse) {
        inverses = inverses.concat(inverse);
      }
    );
  });

  // Allow `transform([])` to succeed
  if (!ret) {
    ret = new Orbit.Promise(function(resolve) { resolve(); });
  }

  return ret.then(function() {
    return inverses;
  });
};

var applyTransform = function(operation) {
  // console.log('applyTransform', this.id, operation);

  var res = this._transform(operation);

  if (res) {
    var _this = this;
    return res.then(
      function(inverse) {
        return _this.settleTransforms().then(function () {
          return inverse;
        });
      }
    );

  } else {
    return this.settleTransforms();
  }
};

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object.transformQueue = new ActionQueue(applyTransform, object);
      object._completedTransforms = [];

      Evented.extend(object);

      object.didTransform = function(operation, inverse) {
        object._completedTransforms.push([operation, inverse]);
      };

      object.settleTransforms = function() {
        var _this = this;
        var ops = this._completedTransforms;

        // console.log('settleTransforms', this.id, ops);

        _this.settlingTransforms = true;

        return new Orbit.Promise(function(resolve) {
          var settleEach = function() {
            if (ops.length === 0) {
              _this.settlingTransforms = false;
              resolve();

            } else {
              var op = ops.shift();

              // console.log('settleTransforms#settleEach', _this.id, ops.length + 1, 'didTransform', op[0], op[1]);

              var response = _this.settle.call(_this, 'didTransform', op[0], op[1]);
              if (response) {
                return response.then(settleEach, settleEach);
              } else {
                settleEach();
              }
            }
          };

          settleEach();
        });
      };

      object.transform = function(operation) {
        assert('_transform must be defined', object._transform);

        if (isArray(operation)) {
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