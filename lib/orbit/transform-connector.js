import { Class, clone, isNone } from './lib/objects';
import { diffs } from './lib/diffs';
import { eq } from './lib/eq';
import { arrayToOptions } from './lib/config';

/**
 A `TransformConnector` observes a source's transforms and applies them to a
 target.

 Each connector is "one way", so bi-directional synchronization between sources
 requires the creation of two connectors.

 A `TransformConnector` can operate in one of two modes:

 - In the default "blocking" mode, a connector will return a promise to the
 `didTransform` event, which will prevent the original transform from resolving
 until the promise itself has resolved.

 - In "non-blocking" mode, transforms do not block the resolution of the original
 transform - asynchronous actions are performed afterward.

 The connector's `transform` method actually applies transforms to its target.
 This method attempts to retrieve the current value at the path of the
 transformation and resolves any conflicts with the connector's
 `resolveConflicts` method. By default, a simple differential is applied to the
 target, although both `transform` and `resolveConflicts` can be overridden to
 apply an alternative differencing algorithm.

 @class TransformConnector
 @namespace Orbit
 @param {Object}  source
 @param {Object}  target
 @param {Object}  [options]
 @param {String}  [options.blocking=true] Does the connector wait for promises to be settled?
 @param {Boolean} [options.active=true] Is the connector is actively observing the `source`?
 @constructor
 */
var TransformConnector = Class.extend({
  init: function(source, target, options) {
    this.source = source;
    this.target = target;

    options = options || {};
    this.blocking = options.blocking !== undefined ? options.blocking : true;
    var active = options.active !== undefined ? options.active : true;

    if (options.rollbackTransformsOnFailure) {
      console.error('TransformConnector#rollbackTransformsOnFailure is no longer supported.');
    }

    if (active) this.activate();
  },

  activate: function() {
    if (this._active) return;

    this.source.on('didTransform',  this._processTransform,  this);

    this._active = true;
  },

  deactivate: function() {
    this.source.off('didTransform',  this._processTransform,  this);

    this._active = false;
  },

  isActive: function() {
    return this._active;
  },

  transform: function(operation) {
    // console.log('****', ' transform from ', this.source.id, ' to ', this.target.id, operation);

    var _this = this;

    // If the target is currently processing a transformation and this
    // operation does not belong to that transformation, then wait for the
    // transformation to complete before applying this operation.
    //
    // This will be called recursively to process multiple transformations if
    // necessary.
    var currentTransformation = this.target.currentTransformation();
    if (currentTransformation && !currentTransformation.verifyOperation(operation)) {
      // console.log('>>>> TransformConnector#transform - waiting', this.source.id, this.target.id, operation);
      return currentTransformation.process().then(function() {
        // console.log('<<<< TransformConnector#transform - done waiting', _this.source.id, _this.target.id, operation);
        return _this.transform(operation);
      });
    }

    if (this.target.retrieve) {
      var currentValue = this.target.retrieve(operation.path);

      // console.log('currentValue', currentValue, ' transform from ', this.source.id, ' to ', this.target.id, operation);

      if (isNone(currentValue)) {
        // Removing a null value, or replacing it with another null value, is unnecessary
        if ((operation.op === 'remove') ||
            (operation.op === 'replace' && isNone(operation.value))) {
          return;
        }

      } else if (operation.op === 'add' || operation.op === 'replace') {
        if (eq(currentValue, operation.value)) {
          // Replacing a value with its equivalent is unnecessary
          return;

        } else {
          return this.resolveConflicts(operation.path, currentValue, operation.value, operation);
        }
      }
    }

    return this.target.transform(operation);
  },

  resolveConflicts: function(path, currentValue, updatedValue, operation) {
    var ops = diffs(currentValue, updatedValue, { basePath: path });

    if (ops) {
      var spawnedOps = ops.map(function(op) {
        return operation.spawn(op);
      });

      // console.log(this.target.id, 'resolveConflicts', path, currentValue, updatedValue, spawnedOps);

      return this.target.transform(spawnedOps);
    }
  },

  /**
   @method filterFunction
   @param {Object} operation
   @return {Boolean} `true` if the operation should be processed
   */
  filterFunction: null,

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _processTransform: function(operation, inverseOps) {
    // console.log('****', ' processTransform from ', this.source.id, ' to ', this.target.id, operation);

    if (this.filterFunction) {
      if (!this.filterFunction(operation)) return;
    }

    if (this.blocking) {
      return this.transform(operation);

    } else {
      this.transform(operation);
    }
  }
});

export default TransformConnector;
