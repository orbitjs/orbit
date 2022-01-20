import { buildTransform, Transform } from '../../src/transform';
import { Source } from '../../src/source';
import {
  syncable,
  isSyncable,
  Syncable
} from '../../src/source-interfaces/syncable';
import {
  RecordOperation,
  RecordTransformBuilder
} from '../support/record-data';

const { module, test } = QUnit;

module('@syncable', function (hooks) {
  interface MySource
    extends Source,
      Syncable<RecordOperation, RecordTransformBuilder> {}
  @syncable
  class MySource extends Source {}

  let source: MySource;

  hooks.beforeEach(function () {
    source = new MySource({
      name: 'src1',
      transformBuilder: new RecordTransformBuilder()
    });
  });

  test('isSyncable - tests for the application of the @syncable decorator', function (assert) {
    assert.ok(isSyncable(source));
  });

  test('should be applied to a Source', function (assert) {
    assert.throws(
      function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Test of bad typing
        @syncable
        class Vanilla {}
      },
      Error(
        'Assertion failed: Syncable interface can only be applied to a Source'
      ),
      'assertion raised'
    );
  });

  test('#sync can accept a single Transform and call internal method `_sync`', async function (assert) {
    assert.expect(2);

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    source._sync = async function (transform: Transform<RecordOperation>) {
      assert.strictEqual(
        transform,
        addRecordTransform,
        'argument to _sync is a Transform'
      );
    };

    await source.sync(addRecordTransform);

    assert.ok(true, 'transformed promise resolved');
  });

  test('#sync can accept an array of Transforms and call internal method `_sync` for each', async function (assert) {
    assert.expect(3);

    const addEarth = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'earth' }
    });
    const addJupiter = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    let order = 0;
    source._sync = async function (transform: Transform<RecordOperation>) {
      order++;
      if (order === 1) {
        assert.strictEqual(
          transform,
          addEarth,
          'expected transform passed to _sync'
        );
      } else if (order === 2) {
        assert.strictEqual(
          transform,
          addJupiter,
          'expected transform passed to _sync'
        );
      } else {
        assert.ok(false, 'unexpected');
      }
    };

    await source.sync([addEarth, addJupiter]);

    assert.ok(true, 'transformed promise resolved');
  });

  test('#sync can accept a transform builder function, create a transform, and call internal method `_sync`', async function (assert) {
    assert.expect(2);

    const earth = { type: 'planet', id: 'earth' };
    const jupiter = { type: 'planet', id: 'jupiter' };

    let order = 0;
    source._sync = async function (transform: Transform<RecordOperation>) {
      order++;
      if (order === 1) {
        assert.deepEqual(
          transform.operations as RecordOperation[],
          [
            {
              op: 'addRecord',
              record: earth
            },
            {
              op: 'addRecord',
              record: jupiter
            }
          ],
          'transform passed to _sync with correct data'
        );
      } else {
        assert.ok(false, 'unexpected');
      }
    };

    await source.sync((t) => [t.addRecord(earth), t.addRecord(jupiter)]);

    assert.ok(true, 'transformed promise resolved');
  });

  test('#sync should resolve as a failure when `_sync` fails', async function (assert) {
    assert.expect(2);

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    source._sync = async function (transform: Transform<RecordOperation>) {
      return Promise.reject(':(');
    };

    try {
      await source.sync(addRecordTransform);
    } catch (error) {
      assert.ok(true, 'sync promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#sync should trigger `sync` event after a successful action in which `_sync` returns an array of transforms', async function (assert) {
    assert.expect(9);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    source.on('beforeSync', (transform) => {
      assert.equal(++order, 1, 'beforeSync triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._sync = async function (transform) {
      assert.equal(++order, 2, 'action performed after beforeSync');
      assert.strictEqual(
        transform,
        addRecordTransform,
        'transform object matches'
      );
    };

    source.on('transform', (transform) => {
      assert.equal(
        ++order,
        3,
        'transform triggered after action performed successfully'
      );
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return Promise.resolve();
    });

    source.on('sync', (transform) => {
      assert.equal(
        ++order,
        4,
        'sync triggered after action performed successfully'
      );
      assert.strictEqual(
        transform,
        addRecordTransform,
        'sync transform matches'
      );
    });

    await source.sync(addRecordTransform);

    assert.equal(++order, 5, 'promise resolved last');
  });

  test('#sync should trigger `syncFail` event after an unsuccessful sync', async function (assert) {
    assert.expect(7);

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    let order = 0;

    source._sync = async function (transform: Transform<RecordOperation>) {
      assert.equal(++order, 1, 'action performed first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      throw new Error(':(');
    };

    source.on('sync', () => {
      assert.ok(false, 'sync should not be triggered');
    });

    source.on('syncFail', (transform, error) => {
      assert.equal(++order, 2, 'syncFail triggered after an unsuccessful sync');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      assert.equal(error.message, ':(', 'error matches');
    });

    try {
      await source.sync(addRecordTransform);
    } catch (e) {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal((e as Error).message, ':(', 'failure');
    }
  });

  test('#sync should still call `_sync` if the transform has been applied as a result of `beforeSync` resolution', async function (assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    source.on('beforeSync', () => {
      assert.equal(++order, 1, 'beforeSync triggered first');

      // source transformed
      source.transformLog.append(addRecordTransform.id);

      return Promise.resolve();
    });

    source._sync = async function (transform: Transform<RecordOperation>) {
      assert.ok(true, '_sync should still be reached');
      assert.ok(
        this.transformLog.contains(transform.id),
        'transform is already contained in the log'
      );
    };

    source.on('sync', () => {
      assert.ok(true, 'sync should still be reached');
    });

    await source.sync(addRecordTransform);

    assert.equal(++order, 2, 'promise resolved last');
  });

  test('#sync should resolve all promises returned from `beforeSync` before calling `_sync`', async function (assert) {
    assert.expect(6);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    source.on('beforeSync', () => {
      assert.equal(++order, 1, 'beforeSync triggered first');
      return Promise.resolve();
    });

    source.on('beforeSync', () => {
      assert.equal(++order, 2, 'beforeSync triggered second');
      return undefined;
    });

    source.on('beforeSync', () => {
      assert.equal(++order, 3, 'beforeSync triggered third');
      return Promise.resolve();
    });

    source._sync = async function (transform: Transform<RecordOperation>) {
      assert.equal(++order, 4, '_sync invoked after all `beforeSync` handlers');
    };

    source.on('sync', () => {
      assert.equal(
        ++order,
        5,
        'sync triggered after action performed successfully'
      );
    });

    await source.sync(addRecordTransform);

    assert.equal(++order, 6, 'promise resolved last');
  });

  test('#sync should resolve all promises returned from `beforeSync` and fail if any fail', async function (assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: 'jupiter' }
    });

    source.on('beforeSync', () => {
      assert.equal(++order, 1, 'beforeSync triggered first');
      return Promise.resolve();
    });

    source.on('beforeSync', () => {
      assert.equal(++order, 2, 'beforeSync triggered again');
      return Promise.reject(':(');
    });

    source._sync = async function (transform: Transform<RecordOperation>) {
      assert.ok(false, '_sync should not be invoked');
    };

    source.on('sync', () => {
      assert.ok(false, 'sync should not be triggered');
    });

    source.on('syncFail', () => {
      assert.equal(++order, 3, 'syncFail triggered after action failed');
    });

    try {
      await source.sync(addRecordTransform);
    } catch (error) {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    }
  });
});
