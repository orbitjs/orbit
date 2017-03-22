import Orbit from '../../src/main';
import { Bucket } from '../../src/bucket';

/**
 * A simple implementation of a Bucket that saves values to an in-memory
 * object. Not practical, since Buckets are intended to persist values from
 * memory, but useful for testing.
 */
export default class FakeBucket extends Bucket {
  constructor(settings = {}) {
    super(settings);
    this.data = {};
  }

  getItem(key) {
    return Orbit.Promise.resolve(this.data[key]);
  }

  setItem(key, value) {
    this.data[key] = value;
    return Orbit.Promise.resolve();
  }

  removeItem(key) {
    delete this.data[key];
    return Orbit.Promise.resolve();
  }
}
