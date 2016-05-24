import Orbit from './main';
import Evented from './evented';
import TransformLog from './transform/log';
import { assert } from './lib/assert';

/**
 `Source` is an abstract base class to be extended by other sources.

 @class Source
 @namespace Orbit
 @param {Object}    [options]
 @constructor
*/
export default class Source {
  constructor(options) {
    Evented.extend(this);

    this.transformLog = new TransformLog();
  }

  transformed(transforms) {
    return transforms
      .reduce((chain, transform) => {
        return chain.then(() => {
          if (this.transformLog.contains(transform.id)) {
            return Orbit.Promise.resolve();
          }

          this.transformLog.append(transform.id);
          return this.settle('transform', transform);
        });
      }, Orbit.Promise.resolve())
      .then(() => transforms);
  }
}
