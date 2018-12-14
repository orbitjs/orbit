import { Bucket } from '@orbit/core';
import { Dict } from '@orbit/utils';

/**
 * A simple implementation of a Bucket that saves values to an in-memory
 * object. Not practical, since Buckets are intended to persist values from
 * memory, but useful for testing.
 */
export default class FakeBucket extends Bucket {
  data: Dict<any>;

  constructor(settings = {}) {
    super(settings);
    this.data = {};
  }

  getItem(key) {
    return Promise.resolve(this.data[key]);
  }

  setItem(key, value) {
    this.data[key] = value;
    return Promise.resolve();
  }

  removeItem(key) {
    delete this.data[key];
    return Promise.resolve();
  }
}
