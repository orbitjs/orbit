import { KeyMap, Schema } from '@orbit/data';
import { AsyncSchemaValidationProcessor } from '../src/operation-processors/async-schema-validation-processor';
import { ExampleAsyncRecordCache } from './support/example-async-record-cache';
import { createSchemaWithRemoteKey } from './support/setup';

const { module, test } = QUnit;

module('AsyncRecordCache', function (hooks) {
  let schema: Schema, keyMap: KeyMap;

  hooks.beforeEach(function () {
    schema = createSchemaWithRemoteKey();
    keyMap = new KeyMap();
  });

  test('it exists', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema });

    assert.ok(cache);
    assert.equal(
      cache.processors.length,
      3,
      'processors are assigned by default'
    );
  });

  test('it requires a schema', function (assert) {
    assert.expect(1);
    let schema = (undefined as unknown) as Schema;
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
