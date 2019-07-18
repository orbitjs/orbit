import {
  Source,
  Pushable,
  pushable,
  isPushable,
  buildTransform,
  Transform,
  TransformOrOperations
} from '../../src/index';
import '../test-helper';

const { module, test } = QUnit;

module('@pushable', function(hooks) {
  @pushable
  class MySource extends Source implements Pushable {
    push: (
      transformOrOperations: TransformOrOperations,
      options?: object,
      id?: string
    ) => Promise<Transform[]>;
    _push: (transform: Transform, hints?: any) => Promise<Transform[]>;
  }

  let source: MySource;

  hooks.beforeEach(function() {
    source = new MySource({ name: 'src1' });
  });

  hooks.afterEach(function() {
    source = null;
  });

  test('isPushable - tests for the application of the @pushable decorator', function(assert) {
    assert.ok(isPushable(source));
  });

  // TODO
  // test('should be applied to a Source', function(assert) {
  //   assert.throws(function() {
  //     @pushable
  //     class Vanilla {}
  //   },
  //   Error('Assertion failed: Pushable interface can only be applied to a Source'),
  //   'assertion raised');
  // });

  test('#push should resolve as a failure when `transform` fails', async function(assert) {
    assert.expect(2);

    source._push = function() {
      return Promise.reject(':(');
    };

    try {
      await source.push({ op: 'addRecord' });
    } catch (error) {
      assert.ok(true, 'push promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#push should trigger `push` event after a successful action in which `transform` returns an array of transforms', async function(assert) {
    assert.expect(12);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });
    const replaceAttributeTransform = buildTransform({
      op: 'replaceRecordAttribute'
    });

    const resultingTransforms = [addRecordTransform, replaceAttributeTransform];

    source.on('beforePush', transform => {
      assert.equal(++order, 1, 'beforePush triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._push = async function(transform) {
      assert.equal(++order, 2, 'action performed after beforePush');
      assert.strictEqual(
        transform,
        addRecordTransform,
        'transform object matches'
      );
      await this.transformed(resultingTransforms);
      return resultingTransforms;
    };

    let transformCount = 0;
    source.on('transform', transform => {
      assert.equal(
        ++order,
        3 + transformCount,
        'transform triggered after action performed successfully'
      );
      assert.strictEqual(
        transform,
        resultingTransforms[transformCount++],
        'transform matches'
      );
      return Promise.resolve();
    });

    source.on('push', transform => {
      assert.equal(
        ++order,
        5,
        'push triggered after action performed successfully'
      );
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    let result = await source.push(addRecordTransform);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(
      result,
      resultingTransforms,
      'applied transforms are returned on success'
    );
  });

  test('#push should trigger `pushFail` event after an unsuccessful push', async function(assert) {
    assert.expect(7);

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    let order = 0;

    source._push = function(transform) {
      assert.equal(++order, 1, 'action performed after willPush');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return Promise.reject(':(');
    };

    source.on('push', () => {
      assert.ok(false, 'push should not be triggered');
    });

    source.on('pushFail', (transform, error) => {
      assert.equal(++order, 2, 'pushFail triggered after an unsuccessful push');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.push(addRecordTransform);
    } catch (error) {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#push should resolve all promises returned from `beforePush` before calling `_push`', async function(assert) {
    assert.expect(7);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });
    const replaceAttributeTransform = buildTransform({
      op: 'replaceRecordAttribute'
    });

    const resultingTransforms = [addRecordTransform, replaceAttributeTransform];

    source.on('beforePush', () => {
      assert.equal(++order, 1, 'beforePush triggered first');
      return Promise.resolve();
    });

    source.on('beforePush', () => {
      assert.equal(++order, 2, 'beforePush triggered second');
      return undefined;
    });

    source.on('beforePush', () => {
      assert.equal(++order, 3, 'beforePush triggered third');
      return Promise.resolve();
    });

    source._push = async function() {
      assert.equal(++order, 4, '_push invoked after all `beforePush` handlers');
      return resultingTransforms;
    };

    source.on('push', () => {
      assert.equal(
        ++order,
        5,
        'push triggered after action performed successfully'
      );
    });

    let result = await source.push(addRecordTransform);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(
      result,
      resultingTransforms,
      'applied transforms are returned on success'
    );
  });

  test('#push should still call `_push` if the transform has been applied as a result of `beforePush` resolution', async function(assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforePush', () => {
      assert.equal(++order, 1, 'beforePush triggered first');

      // source transformed
      source.transformLog.append(addRecordTransform.id);

      return Promise.resolve();
    });

    source._push = async function(): Promise<Transform[]> {
      assert.ok(true, '_push should still be reached');
      assert.ok(
        this.transformLog.contains(addRecordTransform.id),
        'transform is already contained in the log'
      );
      return [];
    };

    source.on('push', () => {
      assert.ok(true, 'push should still be reached');
    });

    await source.push(addRecordTransform);

    assert.equal(++order, 2, 'promise resolved last');
  });

  test('#push should resolve all promises returned from `beforePush` and fail if any fail', async function(assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforePush', () => {
      assert.equal(++order, 1, 'beforePush triggered first');
      return Promise.resolve();
    });

    source.on('beforePush', () => {
      assert.equal(++order, 2, 'beforePush triggered again');
      return Promise.reject(':(');
    });

    source._push = async function(): Promise<Transform[]> {
      assert.ok(false, '_push should not be invoked');
      return [];
    };

    source.on('push', () => {
      assert.ok(false, 'push should not be triggered');
    });

    source.on('pushFail', () => {
      assert.equal(++order, 3, 'pushFail triggered after action failed');
    });

    try {
      await source.push(addRecordTransform);
    } catch (error) {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#push should pass a common `hints` object to all `beforePush` events and forward it to `_push`', async function(assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });
    const replaceAttributeTransform = buildTransform({
      op: 'replaceRecordAttribute'
    });
    let h: any;
    const resultingTransforms = [addRecordTransform, replaceAttributeTransform];

    source.on('beforePush', async function(transform: Transform, hints: any) {
      assert.equal(++order, 1, 'beforePush triggered first');
      assert.deepEqual(hints, {}, 'beforePush is passed empty `hints` object');
      h = hints;
      hints.foo = 'bar';
    });

    source.on('beforePush', async function(transform: Transform, hints: any) {
      assert.equal(++order, 2, 'beforePush triggered second');
      assert.strictEqual(hints, h, 'beforePush is passed same hints instance');
    });

    source.on('beforePush', async function(transform: Transform, hints: any) {
      assert.equal(++order, 3, 'beforePush triggered third');
      assert.strictEqual(hints, h, 'beforePush is passed same hints instance');
    });

    source._push = async function(transform: Transform, hints: any) {
      assert.equal(++order, 4, '_push invoked after all `beforePush` handlers');
      assert.strictEqual(hints, h, '_push is passed same hints instance');
      return resultingTransforms;
    };

    source.on('push', () => {
      assert.equal(
        ++order,
        5,
        'push triggered after action performed successfully'
      );
    });

    let result = await source.push(addRecordTransform);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(
      result,
      resultingTransforms,
      'applied transforms are returned on success'
    );
  });
});
