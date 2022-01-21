import {
  RecordKeyMap,
  RecordSchema,
  StandardRecordNormalizer
} from '@orbit/records';
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

  test('it is assigned 3 processors, a validatorFor, transformBuilder, and queryBuilder by default', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema });

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
    const cache = new ExampleAsyncRecordCache({ schema, autoValidate: false });
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
