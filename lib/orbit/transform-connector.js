import { assert } from 'orbit/lib/assert';
import { Class, clone, isNone } from './lib/objects';

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

 The connector's `applyTransform` method actually applies transforms to its
 target.

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

  transform: function(transform) {
    // console.log('****', ' transform from ', this.source.id, ' to ', this.target.id, transform);

    return this.target.transform(transform);
  },

  /**
   @method shouldTransform
   @param {Transform} [transform] transform applied to the source
   @return {Boolean} `true` if the transform should be applied to the target
   */
  shouldTransform: null,

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _processTransform: function(transform) {
    // console.log('****', ' processTransform from ', this.source.id, ' to ', this.target.id, transform);

    // if (result.operations.length === 0) return;

    if (this.shouldTransform) {
      if (!this.shouldTransform(transform)) return;
    }

    var promise = this.transform(transform);

    if (this.blocking) return promise;
  }
});

export default TransformConnector;
