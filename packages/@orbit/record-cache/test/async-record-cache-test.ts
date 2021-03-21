import { Orbit } from '@orbit/core';
import { RecordKeyMap, RecordSchema } from '@orbit/records';
import { AsyncSchemaValidationProcessor } from '../src/operation-processors/async-schema-validation-processor';
import { ExampleAsyncRecordCache } from './support/example-async-record-cache';
import { createSchemaWithRemoteKey } from './support/setup';

const { module, test } = QUnit;

module('AsyncRecordCache', function (hooks) {
  let schema: RecordSchema, keyMap: RecordKeyMap;

  hooks.beforeEach(function () {
    schema = createSchemaWithRemoteKey();
    keyMap = new RecordKeyMap();
  });

  test('it exists', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema });
    assert.ok(cache);
  });

  test('it is assigned 3 processors by default in debug mode', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema });
    assert.ok(Orbit.debug);
    assert.equal(
      cache.processors.length,
      3,
      'processors are assigned by default'
    );
  });

  test('it is assigned only 2 processors by default in non-debug mode', async function (assert) {
    Orbit.debug = false;
    const cache = new ExampleAsyncRecordCache({ schema });
    assert.equal(
      cache.processors.length,
      2,
      'processors are assigned by default'
    );
    Orbit.debug = true;
  });

  test('it requires a schema', function (assert) {
    assert.expect(1);
    let schema = (undefined as unknown) as RecordSchema;
    assert.throws(() => new ExampleAsyncRecordCache({ schema }));
  });

  test('can be assigned processors', async function (assert) {
    let cache = new ExampleAsyncRecordCache({
      schema,
      processors: [AsyncSchemaValidationProcessor]
    });
    assert.ok(cache);

    class FakeProcessor {}
    assert.throws(
      () =>
        (cache = new ExampleAsyncRecordCache({
          schema,
          processors: [FakeProcessor as any]
        }))
    );
  });
});
