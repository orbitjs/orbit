import {
  Source,
  updatable,
  isUpdatable,
  Updatable,
  buildTransform,
  Transform,
  TransformOrOperations
} from '../../src/index';
import '../test-helper';

const { module, test } = QUnit;

module('@updatable', function(hooks) {
  @updatable
  class MySource extends Source implements Updatable {
    update: (
      transformOrOperations: TransformOrOperations,
      options?: object,
      id?: string
    ) => Promise<any>;
    _update: (transform: Transform, hints?: any) => Promise<any>;
  }

  let source: MySource;

  hooks.beforeEach(function() {
    source = new MySource({ name: 'src1' });
  });

  hooks.afterEach(function() {
    source = null;
  });

  test('isUpdatable - tests for the application of the @updatable decorator', function(assert) {
    assert.ok(isUpdatable(source));
  });

  // TODO
  // test('should be applied to a Source', function(assert) {
  //   assert.throws(function() {
  //     @updatable
  //     class Vanilla {}
  //   },
  //   Error('Assertion failed: Updatable interface can only be applied to a Source'),
  //   'assertion raised');
  // });

  test('#update should resolve as a failure when `transform` fails', async function(assert) {
    assert.expect(2);

    source._update = function() {
      return Promise.reject(':(');
    };

    try {
      await source.update({ op: 'addRecord' });
    } catch (error) {
      assert.ok(true, 'update promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#update should trigger `update` event after a successful action in which `_update` returns an array of transforms', async function(assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforeUpdate', transform => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._update = async function(transform) {
      assert.equal(++order, 2, 'action performed after beforeUpdate');
      assert.strictEqual(
        transform,
        addRecordTransform,
        'transform object matches'
      );
      await this.transformed([transform]);
      return ':)';
    };

    source.on('transform', transform => {
      assert.equal(
        ++order,
        3,
        'transform triggered after action performed successfully'
      );
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return Promise.resolve();
    });

    source.on('update', (transform, result) => {
      assert.equal(
        ++order,
        4,
        'update triggered after action performed successfully'
      );
      assert.strictEqual(
        transform,
        addRecordTransform,
        'update transform matches'
      );
      assert.equal(result, ':)', 'result matches');
    });

    let result = await source.update(addRecordTransform);

    assert.equal(++order, 5, 'promise resolved last');
    assert.equal(result, ':)', 'success!');
  });

  test('`update` event should receive results as the last argument, even if they are an array', async function(assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforeUpdate', transform => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._update = async function(transform) {
      assert.equal(++order, 2, 'action performed after beforeUpdate');
      assert.strictEqual(
        transform,
        addRecordTransform,
        'transform object matches'
      );
      await this.transformed([transform]);
      return ['a', 'b', 'c'];
    };

    source.on('transform', transform => {
      assert.equal(
        ++order,
        3,
        'transform triggered after action performed successfully'
      );
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return Promise.resolve();
    });

    source.on('update', (transform, result) => {
      assert.equal(
        ++order,
        4,
        'update triggered after action performed successfully'
      );
      assert.strictEqual(
        transform,
        addRecordTransform,
        'update transform matches'
      );
      assert.deepEqual(result, ['a', 'b', 'c'], 'result matches');
    });

    let result = await source.update(addRecordTransform);

    assert.equal(++order, 5, 'promise resolved last');
    assert.deepEqual(result, ['a', 'b', 'c'], 'success!');
  });

  test('#update should trigger `updateFail` event after an unsuccessful update', async function(assert) {
    assert.expect(7);

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    let order = 0;

    source._update = function(transform) {
      assert.equal(++order, 1, 'action performed after beforeUpdate');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return Promise.reject(':(');
    };

    source.on('update', () => {
      assert.ok(false, 'update should not be triggered');
    });

    source.on('updateFail', (transform, error) => {
      assert.equal(
        ++order,
        2,
        'updateFail triggered after an unsuccessful update'
      );
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.update(addRecordTransform);
    } catch (error) {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#update should resolve all promises returned from `beforeUpdate` before calling `_update`', async function(assert) {
    assert.expect(6);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      return Promise.resolve();
    });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 2, 'beforeUpdate triggered second');
      return undefined;
    });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 3, 'beforeUpdate triggered third');
      return Promise.resolve();
    });

    source._update = async function() {
      assert.equal(
        ++order,
        4,
        '_update invoked after all `beforeUpdate` handlers'
      );
    };

    source.on('update', () => {
      assert.equal(
        ++order,
        5,
        'update triggered after action performed successfully'
      );
    });

    await source.update(addRecordTransform);

    assert.equal(++order, 6, 'promise resolved last');
  });

  test('#update should still call `_update` if the transform has been applied as a result of `beforeUpdate` resolution', async function(assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');

      // source transformed
      source.transformLog.append(addRecordTransform.id);

      return Promise.resolve();
    });

    source._update = async function(transform) {
      assert.ok(true, '_update should still be reached');
      assert.ok(
        this.transformLog.contains(transform.id),
        'transform is already contained in the log'
      );
    };

    source.on('update', () => {
      assert.ok(true, 'update should still be reached');
    });

    await source.update(addRecordTransform);

    assert.equal(++order, 2, 'promise resolved last');
  });

  test('#update should resolve all promises returned from `beforeUpdate` and fail if any fail', async function(assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      return Promise.resolve();
    });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 2, 'beforeUpdate triggered again');
      return Promise.reject(':(');
    });

    source._update = async function() {
      assert.ok(false, '_update should not be invoked');
    };

    source.on('update', () => {
      assert.ok(false, 'update should not be triggered');
    });

    source.on('updateFail', () => {
      assert.equal(++order, 3, 'updateFail triggered after action failed');
    });

    try {
      await source.update(addRecordTransform);
    } catch (error) {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#update should pass a common `hints` object to all `beforeUpdate` events and forward it to `_update`', async function(assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });
    const replaceAttributeTransform = buildTransform({
      op: 'replaceRecordAttribute'
    });
    let h: any;
    const resultingTransforms = [addRecordTransform, replaceAttributeTransform];

    source.on('beforeUpdate', async function(transform: Transform, hints: any) {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.deepEqual(
        hints,
        {},
        'beforeUpdate is passed empty `hints` object'
      );
      h = hints;
      hints.foo = 'bar';
    });

    source.on('beforeUpdate', async function(transform: Transform, hints: any) {
      assert.equal(++order, 2, 'beforeUpdate triggered second');
      assert.strictEqual(
        hints,
        h,
        'beforeUpdate is passed same hints instance'
      );
    });

    source.on('beforeUpdate', async function(transform: Transform, hints: any) {
      assert.equal(++order, 3, 'beforeUpdate triggered third');
      assert.strictEqual(
        hints,
        h,
        'beforeUpdate is passed same hints instance'
      );
    });

    source._update = async function(transform: Transform, hints: any) {
      assert.equal(
        ++order,
        4,
        '_update invoked after all `beforeUpdate` handlers'
      );
      assert.strictEqual(hints, h, '_update is passed same hints instance');
      return resultingTransforms;
    };

    source.on('update', () => {
      assert.equal(
        ++order,
        5,
        'update triggered after action performed successfully'
      );
    });

    let result = await source.update(addRecordTransform);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(
      result,
      resultingTransforms,
      'applied transforms are returned on success'
    );
  });
});
