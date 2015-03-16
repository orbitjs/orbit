import Orbit from './main';
import { Class, isArray } from './lib/objects';
import ActionQueue from './action-queue';
import Evented from './evented';
import Operation from './operation';
import { assert } from './lib/assert';

export default Class.extend({
  target: null,

  queue: null,

  originalOperations: null,

  completedOperations: null,

  inverseOperations: null,

  init: function(target) {
    var _this = this;

    assert('_transform must be defined', target._transform);

    Evented.extend(this);

    this.target = target;
    this.queue = new ActionQueue({autoProcess: false});
    this.completedOperations = [];
    this.originalOperations = [];
    this.inverseOperations = [];
  },

  verifyOperation: function(operation) {
    var original;
    for (var i = 0; i < this.originalOperations.length; i++) {
      original = this.originalOperations[i];
      if (operation.relatedTo(original)) {
        // console.log('Transformation#verifyOperation - TRUE', this.target.id, operation);
        return true;
      }
    }
    // console.log('Transformation#verifyOperation - FALSE', this.target.id, operation);
    return false;
  },

  pushOperation: function(operation) {
    var _this = this;

    if (isArray(operation)) {
      if (_this.originalOperations.length === 0) {
        operation.forEach(function(o) {
          _this.originalOperations.push(o);
        });
      }

      return operation.map(function(o) {
        return _this.pushOperation(o);
      });

    } else {
      assert('operation must be an `Operation`', operation instanceof Operation);

      // console.log('Transformation#push - queued', _this.target.id, operation);

      if (_this.originalOperations.length === 0) {
        _this.originalOperations.push(operation);
      }

      if (_this.currentOperation && operation.relatedTo(_this.currentOperation)) {
        // console.log('!!! Transformation spawned from current op');

        return _this._transform(operation);

      } else {
        return this.queue.push({
          id: operation.id,
          data: operation,
          process: function() {
            _this.currentOperation = this.data;
            return _this._transform(this.data).then(function() {
              _this.currentOperation = null;
            });
          }
        });
      }
    }
  },

  pushCompletedOperation: function(operation, inverse) {
    assert('completed operation must be an `Operation`', operation instanceof Operation);

    if (this.originalOperations.length === 0) {
      this.originalOperations.push(operation);
    }

    this.inverseOperations = this.inverseOperations.concat(inverse);
    this.completedOperations.push([operation, inverse]);
  },

  process: function() {
    var _this = this;
    var processing = this.processing;

    // console.log('Transformation#process', _this.target.id, this.queue.content);

    if (!processing) {
      processing = this.processing = this.queue.process().then(function() {
        return _this._settle().then(function() {
          // console.log('Transformation#process settled', _this.target.id);
          // _this.emit('didProcess');
          return _this.inverseOperations;
        // }, function() {
          // _this.emit('didNotProcess');
        });
      });
    }

    return processing;
  },

  _transform: function(operation) {
    // console.log('Transformation#_transform', this.target.id, operation);
    var res = this.target._transform(operation);
    if (res) {
      var _this = this;
      return res.then(function(inverse) {
        // console.log('Transformation#_transform promise resolved - not yet settled', _this.target.id);
        return _this._settle();
      });

    } else {
      return this._settle();
    }
  },

  _settle: function() {
    var _this = this;

    var ops = this.completedOperations;

    // console.log('Transformation#_settle', this.target.id, ops);

    if (!ops || !ops.length) {
      return new Orbit.Promise(function(resolve) {
        resolve();
      });
    }

    if (this.settlingTransforms) {
      return this.settlingTransforms;
    }

    return this.settlingTransforms = new Orbit.Promise(function(resolve) {
      var settleEach = function() {
        if (ops.length === 0) {
          // console.log('Transformation#_settle complete', _this.target.id);
          _this.settlingTransforms = false;
          resolve();

        } else {
          var op = ops.shift();

          // console.log('settle#settleEach', _this.target.id, ops.length + 1, 'didTransform', op[0], op[1]);

          var response = _this.target.settle.call(_this.target, 'didTransform', op[0], op[1]);
          if (response) {
            return response.then(settleEach, settleEach);
          } else {
            settleEach();
          }
        }
      };

      settleEach();
    });
  }
});
