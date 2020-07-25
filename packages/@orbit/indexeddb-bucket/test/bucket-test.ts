import { Bucket } from '@orbit/core';
import { IndexedDBBucket } from '../src/bucket';

const { module, test } = QUnit;

module('IndexedDBBucket', function (hooks) {
  let bucket: IndexedDBBucket;

  hooks.beforeEach(() => {
    bucket = new IndexedDBBucket();
  });

  hooks.afterEach(() => {
    return bucket.deleteDB();
  });

  test('it exists', function (assert) {
    assert.ok(bucket);
  });

  test('its prototype chain is correct', function (assert) {
    assert.ok(bucket instanceof Bucket, 'instanceof Bucket');
  });

  test('is assigned a default `name`, `namespace`, and `version`', function (assert) {
    assert.equal(bucket.name, 'indexedDB', '`name` is `indexedDB` by default');
    assert.equal(
      bucket.namespace,
      'orbit-bucket',
      '`namespace` is `orbit-bucket` by default'
    );
    assert.equal(bucket.version, 1, '`version` is `1` by default');
  });

  test('is assigned a default `dbName` and `dbStoreName`', function (assert) {
    assert.equal(
      bucket.dbName,
      'orbit-bucket',
      '`dbName` is `orbit-bucket` by default'
    );
    assert.equal(
      bucket.dbStoreName,
      'data',
      '`dbStoreName` is `data` by default'
    );
  });

  test('can override `dbName` and `dbStoreName` via `namespace` and `storeName` settings', function (assert) {
    const custom = new IndexedDBBucket({
      namespace: 'orbit-settings',
      storeName: 'settings'
    });
    assert.equal(
      custom.dbName,
      'orbit-settings',
      '`dbName` has been customized'
    );
    assert.equal(
      custom.dbStoreName,
      'settings',
      '`dbStoreName` has been customized'
    );
  });

  test('#upgrade changes the version, calls migrateDB, and then reopens the DB', function (assert) {
    assert.expect(5);

    bucket.migrateDB = function (db, event) {
      assert.equal(
        event.oldVersion,
        1,
        'migrateDB called with oldVersion == 1'
      );
      assert.equal(
        event.newVersion,
        2,
        'migrateDB called with newVersion == 2'
      );
    };

    return bucket
      .openDB()
      .then(() => {
        assert.equal(bucket.dbVersion, 1, 'version == 1');
        return bucket.upgrade({ version: 2 });
      })
      .then(() => {
        assert.equal(bucket.dbVersion, 2, 'version == 2');
        assert.equal(bucket.isDBOpen, true, 'DB has been reopened');
      });
  });

  test('#setItem sets a value, #getItem gets a value, #removeItem removes a value', function (assert) {
    assert.expect(3);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    return bucket
      .getItem('planet')
      .then((item) => assert.equal(item, null, 'bucket does not contain item'))
      .then(() => bucket.setItem('planet', planet))
      .then(() => bucket.getItem('planet'))
      .then((item) => assert.deepEqual(item, planet, 'bucket contains item'))
      .then(() => bucket.removeItem('planet'))
      .then(() => bucket.getItem('planet'))
      .then((item) => assert.equal(item, null, 'bucket does not contain item'));
  });

  test('#clear clears all keys', async function (assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    return bucket
      .setItem('planet', planet)
      .then(() => bucket.getItem('planet'))
      .then((item) => assert.deepEqual(item, planet, 'bucket contains item'))
      .then(() => bucket.clear())
      .then(() => bucket.getItem('planet'))
      .then((item) => assert.equal(item, null, 'bucket does not contain item'));
  });
});
