/**
 * Buckets are used by sources to persist transient state, such as logs and
 * queues, that should not be lost in the event of an unexpected exception or
 * shutdown.
 */
export default class Bucket {
  constructor(options = {}) {
    this.name = options.name;
  }

  getItem(/* key */) {
    console.error('Bucket#getItem not implemented');
  }

  setItem(/* key, value */) {
    console.error('Bucket#setItem not implemented');
  }

  removeItem(/* key */) {
    console.error('Bucket#removeItem not implemented');
  }
}
