import { Bucket } from '@orbit/core';
import LocalStorageBucket from '../src/bucket';

const { module, test } = QUnit;

module('LocalStorageBucket', function(hooks) {
  let bucket;

  hooks.beforeEach(() => {
    bucket = new LocalStorageBucket();
  });

  test('it exists', function(assert) {
    assert.ok(bucket);
  });

  test('its prototype chain is correct', function(assert) {
    assert.ok(bucket instanceof Bucket, 'instanceof Bucket');
  });

  test('is assigned a default name, namespace, and delimiter', function(assert) {
    assert.equal(bucket.name, 'localStorage', '`name` is `localStorage` by default');
    assert.equal(bucket.namespace, 'orbit-bucket', '`namespace` is `orbit-bucket` by default');
    assert.equal(bucket.delimiter, '/', '`delimiter` is `/` by default');
  });

  test('#setItem sets a value, #getItem gets a value, #removeItem removes a value', function(assert) {
    assert.expect(3);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    return bucket.getItem('planet')
      .then(item => assert.equal(item, null, 'bucket does not contain item'))
      .then(() => bucket.setItem('planet', planet))
      .then(() => bucket.getItem('planet'))
      .then(item => assert.deepEqual(item, planet, 'bucket contains item'))
      .then(() => bucket.removeItem('planet'))
      .then(() => bucket.getItem('planet'))
      .then(item => assert.equal(item, null, 'bucket does not contain item'));
  });
});
