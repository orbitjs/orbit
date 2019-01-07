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

  async getItem(key: string): Promise<any> {
    return this.data[key];
  }

  async setItem(key: string, value: any): Promise<void> {
    this.data[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.data[key];
  }
}
