import Orbit from './main';
import Evented from './evented';
import ActionQueue from './action-queue';
import Transform from './transform';
import TransformLog from './transform-log';
import { assert } from './lib/assert';
import { deprecate } from './lib/deprecate';

export default {
  init() {
    this._super(...arguments);

    Evented.extend(this);

    this._transformLog = new TransformLog();
  },

  transformed(transformOrOperations) {
    const transform = Transform.from(transformOrOperations);
    // console.log(`${this.id}:transformed`, transform.id);
    this._transformLog.append(transform.id);
    return this.settle('transform', transform);
  },

  transform(transformOrOperations) {
    const transform = Transform.from(transformOrOperations);
    if (this.contains(transform)) { return; }

    return this._transform(transform);
  },

  contains(transform) {
    return this._transformLog.contains(transform.id);
  },

  clearTransformLog() {
    this._transformLog.clear();
  }
};
