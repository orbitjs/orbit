import { RecordSource } from '../src/record-source';
import { RecordSchema } from '../src/record-schema';
import { FakeBucket } from './support/fake-bucket';

const { module, test } = QUnit;

module('Source', function (hooks) {
  let source: any;
  let schema: RecordSchema;

  class MySource extends RecordSource {}

  hooks.beforeEach(function () {
    schema = new RecordSchema();
  });

  test('it can be instantiated', function (assert) {
    source = new MySource({ schema });
    assert.ok(source);
    assert.ok(source.transformLog, 'has a transform log');
  });

  test('it can be assigned a schema, which will be observed for upgrades by default', async function (assert) {
    assert.expect(2);

    class MyDynamicSource extends RecordSource {
      async upgrade() {
        assert.ok(true, 'upgrade called');
      }
    }

    source = new MyDynamicSource({ schema });

    schema.upgrade({});

    assert.ok(true, 'after upgrade');
  });

  test('it will not be auto-upgraded if autoUpgrade: false setting is specified', function (assert) {
    assert.expect(1);

    class MyDynamicSource extends RecordSource {
      async upgrade(): Promise<void> {
        assert.ok(false, 'upgrade should not be called');
      }
    }

    source = new MyDynamicSource({ schema, autoUpgrade: false });
    schema.upgrade({});
    assert.ok(true, 'after upgrade');
  });

  test('it will create a validatorFor, transformBuilder, and queryBuilder by default', async function (assert) {
    source = new MySource({ schema });

    assert.ok(source.validatorFor, 'validatorFor has been created');
    assert.ok(source.queryBuilder, 'queryBuilder has been created');
    assert.ok(
      source.queryBuilder.$normalizer,
      'normalizer has been created for queryBuilder'
    );
    assert.ok(
      source.queryBuilder.$normalizer.validateInputs,
      'normalizer will validate inputs'
    );
    assert.ok(source.transformBuilder, 'transformBuilder has been created');
    assert.strictEqual(
      source.queryBuilder.$normalizer,
      source.transformBuilder.$normalizer,
      'normalizer is the same for transformBuilder'
    );
  });

  test('it will NOT be assigned a validatorFor function if autoValidate: false is specified', async function (assert) {
    source = new MySource({ schema, autoValidate: false });

    assert.notOk(source.validatorFor, 'validatorFor has NOT been created');
    assert.ok(source.queryBuilder, 'queryBuilder has been created');
    assert.ok(
      source.queryBuilder.$normalizer,
      'normalizer has been created for queryBuilder'
    );
    assert.notOk(
      source.queryBuilder.$normalizer.validateInputs,
      'normalizer will NOT validate inputs'
    );
    assert.ok(source.transformBuilder, 'transformBuilder has been created');
    assert.strictEqual(
      source.queryBuilder.$normalizer,
      source.transformBuilder.$normalizer,
      'normalizer is the same for transformBuilder'
    );
  });

  test('creates a `transformLog`, `requestQueue`, and `syncQueue`, and assigns each the same bucket as the Source', function (assert) {
    assert.expect(8);
    const bucket = new FakeBucket();
    source = new MySource({ name: 'src1', schema, bucket });
    assert.equal(source.name, 'src1', 'source has been assigned name');
    assert.equal(
      source.transformLog.name,
      'src1-log',
      'transformLog has been assigned name'
    );
    assert.equal(
      source.requestQueue.name,
      'src1-requests',
      'requestQueue has been assigned name'
    );
    assert.equal(
      source.syncQueue.name,
      'src1-sync',
      'syncQueue has been assigned name'
    );
    assert.strictEqual(
      source.bucket,
      bucket,
      'source has been assigned bucket'
    );
    assert.strictEqual(
      source.transformLog.bucket,
      bucket,
      'transformLog has been assigned bucket'
    );
    assert.strictEqual(
      source.requestQueue.bucket,
      bucket,
      'requestQueue has been assigned bucket'
    );
    assert.strictEqual(
      source.syncQueue.bucket,
      bucket,
      'syncQueue has been assigned bucket'
    );
  });

  test('it can be instantiated with `defaultQueryOptions` and/or `defaultTransformOptions`', function (assert) {
    const defaultQueryOptions = {
      foo: 'bar'
    };

    const defaultTransformOptions = {
      foo: 'bar'
    };

    source = new MySource({
      schema,
      defaultQueryOptions,
      defaultTransformOptions
    });

    assert.strictEqual(
      source.defaultQueryOptions,
      defaultQueryOptions,
      'defaultQueryOptions remains the same'
    );

    assert.strictEqual(
      source.defaultTransformOptions,
      defaultTransformOptions,
      'defaultTransformOptions remains the same'
    );
  });

  test('`defaultQueryOptions` and `defaultTransformOptions` can be modified', function (assert) {
    const defaultQueryOptions = {
      maxRequests: 3
    };

    const defaultTransformOptions = {
      maxRequests: 1
    };

    source = new MySource({
      schema,
      defaultQueryOptions,
      defaultTransformOptions
    });

    source.defaultQueryOptions = {
      ...source.defaultQueryOptions,
      type: 'query'
    };

    assert.deepEqual(source.defaultQueryOptions, {
      maxRequests: 3,
      type: 'query'
    });

    source.defaultTransformOptions = {
      ...source.defaultTransformOptions,
      type: 'transform'
    };

    assert.deepEqual(source.defaultTransformOptions, {
      maxRequests: 1,
      type: 'transform'
    });
  });
});
