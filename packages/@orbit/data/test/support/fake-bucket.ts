import { Bucket, Task } from '@orbit/core';

/**
 * A simple implementation of a Bucket that saves values to an in-memory
 * object. Not practical, since Buckets are intended to persist values from
 * memory, but useful for testing.
 */
export class FakeBucket extends Bucket<Task[]> {
  #data: {
    [name: string]: Task[];
  };

  constructor(settings = {}) {
    super(settings);
    this.#data = {};
  }

  async getItem(key: string): Promise<Task[]> {
    return this.#data[key];
  }

  async setItem(key: string, value: Task[]): Promise<void> {
    this.#data[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.#data[key];
  }

  async clear(): Promise<void> {
    this.#data = {};
  }
}
