import {
  RecordKeyMap,
  RecordSchema,
  StandardRecordNormalizer
} from '@orbit/records';
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
  });

  test('it is assigned 3 processors, a validatorFor, transformBuilder, and queryBuilder by default', async function (assert) {
    const cache = new ExampleSyncRecordCache({ schema });

    assert.equal(
      cache.processors.length,
      3,
      'processors are assigned by default'
    );
    assert.ok(cache.validatorFor, 'validatorFor has been created');
    assert.ok(cache.queryBuilder, 'queryBuilder has been created');

    const normalizer = cache.queryBuilder
      .$normalizer as StandardRecordNormalizer;

    assert.ok(normalizer, 'normalizer has been created for queryBuilder');
    assert.ok(normalizer.validateInputs, 'normalizer will validate inputs');
    assert.ok(cache.transformBuilder, 'transformBuilder has been created');
    assert.strictEqual(
      cache.queryBuilder.$normalizer,
      cache.transformBuilder.$normalizer,
      'normalizer is the same for transformBuilder'
    );
  });

  test('it is assigned only 2 processors and will NOT be assigned a validatorFor function if autoValidate: false is specified', async function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, autoValidate: false });
    assert.equal(
      cache.processors.length,
      2,
      'processors are assigned by default'
    );
    assert.notOk(cache.validatorFor, 'validatorFor has NOT been created');
    assert.ok(cache.queryBuilder, 'queryBuilder has been created');

    const normalizer = cache.queryBuilder
      .$normalizer as StandardRecordNormalizer;

    assert.ok(normalizer, 'normalizer has been created for queryBuilder');
    assert.notOk(
      normalizer.validateInputs,
      'normalizer will NOT validate inputs'
    );
    assert.ok(cache.transformBuilder, 'transformBuilder has been created');
    assert.strictEqual(
      cache.queryBuilder.$normalizer,
      cache.transformBuilder.$normalizer,
      'normalizer is the same for transformBuilder'
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
