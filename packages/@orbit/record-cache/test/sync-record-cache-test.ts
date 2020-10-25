import { RecordKeyMap, RecordSchema } from '@orbit/records';
import { SyncSchemaValidationProcessor } from '../src/operation-processors/sync-schema-validation-processor';
import { ExampleSyncRecordCache } from './support/example-sync-record-cache';
import { createSchemaWithRemoteKey } from './support/setup';

const { module, test } = QUnit;

module('SyncRecordCache', function (hooks) {
  let schema: RecordSchema, keyMap: RecordKeyMap;

  hooks.beforeEach(function () {
    schema = createSchemaWithRemoteKey();
    keyMap = new RecordKeyMap();
  });

  test('it exists', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema });

    assert.ok(cache);
    assert.equal(
      cache.processors.length,
      3,
      'processors are assigned by default'
    );
  });

  test('it requires a schema', function (assert) {
    assert.expect(1);
    let schema = (undefined as unknown) as RecordSchema;
    assert.throws(() => new ExampleSyncRecordCache({ schema }));
  });

  test('can be assigned processors', function (assert) {
    let cache = new ExampleSyncRecordCache({
      schema,
      processors: [SyncSchemaValidationProcessor]
    });
    assert.ok(cache);

    class FakeProcessor {}
    assert.throws(
      () =>
        (cache = new ExampleSyncRecordCache({
          schema,
          processors: [FakeProcessor as any]
        }))
    );
  });
});
