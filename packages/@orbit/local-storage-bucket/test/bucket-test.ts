import { Bucket } from '@orbit/core';
import { LocalStorageBucket } from '../src/bucket';

const { module, test } = QUnit;

module('LocalStorageBucket', function (hooks) {
  let bucket: LocalStorageBucket;

  hooks.beforeEach(() => {
    bucket = new LocalStorageBucket();
  });

  test('it exists', function (assert) {
    assert.ok(bucket);
  });

  test('its prototype chain is correct', function (assert) {
    assert.ok(bucket instanceof Bucket, 'instanceof Bucket');
  });

  test('is assigned a default name, namespace, and delimiter', function (assert) {
    assert.equal(
      bucket.name,
      'localStorage',
      '`name` is `localStorage` by default'
    );
    assert.equal(
      bucket.namespace,
      'orbit-bucket',
      '`namespace` is `orbit-bucket` by default'
    );
    assert.equal(bucket.delimiter, '/', '`delimiter` is `/` by default');
  });

  test('#setItem sets a value, #getItem gets a value, #removeItem removes a value', async function (assert) {
    assert.expect(3);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let item = await bucket.getItem('planet');
    assert.equal(item, null, 'bucket does not contain item');

    await bucket.setItem('planet', planet);
    item = await bucket.getItem('planet');
    assert.deepEqual(item, planet, 'bucket contains item');

    await bucket.removeItem('planet');
    item = await bucket.getItem('planet');
    assert.equal(item, null, 'bucket does not contain item');
  });

  test('#clear clears all keys', async function (assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    await bucket.setItem('planet', planet);
    let item = await bucket.getItem('planet');
    assert.deepEqual(item, planet, 'bucket contains item');

    await bucket.clear();
    item = await bucket.getItem('planet');
    assert.equal(item, null, 'bucket does not contain item');
  });
});
