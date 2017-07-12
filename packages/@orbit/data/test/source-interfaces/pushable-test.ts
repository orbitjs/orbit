import Orbit, {
  Source,
  pushable, isPushable,
  buildTransform
} from '../../src/index';
import '../test-helper';

const { Promise } = Orbit;
const { module, test } = QUnit;

module('@pushable', function(hooks) {
  let source;

  hooks.beforeEach(function() {
    @pushable
    class MySource extends Source {}

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

  test('#push should resolve as a failure when `transform` fails', function(assert) {
    assert.expect(2);

    source._push = function() {
      return Promise.reject(':(');
    };

    return source.push({ addRecord: {} })
      .catch((error) => {
        assert.ok(true, 'push promise resolved as a failure');
        assert.equal(error, ':(', 'failure');
      });
  });

  test('#push should trigger `push` event after a successful action in which `transform` returns an array of transforms', function(assert) {
    assert.expect(12);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });
    const replaceAttributeTransform = buildTransform({ op: 'replaceRecordAttribute' });

    const resultingTransforms = [
      addRecordTransform,
      replaceAttributeTransform
    ];

    source.on('beforePush', (transform) => {
      assert.equal(++order, 1, 'beforePush triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._push = function(transform) {
      assert.equal(++order, 2, 'action performed after beforePush');
      assert.strictEqual(transform, addRecordTransform, 'transform object matches');
      return Promise.resolve(resultingTransforms);
    };

    let transformCount = 0;
    source.on('transform', (transform) => {
      assert.equal(++order, 3 + transformCount, 'transform triggered after action performed successfully');
      assert.strictEqual(transform, resultingTransforms[transformCount++], 'transform matches');
      return Promise.resolve();
    });

    source.on('push', (transform) => {
      assert.equal(++order, 5, 'push triggered after action performed successfully');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    return source.push(addRecordTransform)
      .then((result) => {
        assert.equal(++order, 6, 'promise resolved last');
        assert.deepEqual(result, resultingTransforms, 'applied transforms are returned on success');
      });
  });

  test('#push should trigger `pushFail` event after an unsuccessful push', function(assert) {
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

    return source.push(addRecordTransform)
      .catch((error) => {
        assert.equal(++order, 3, 'promise resolved last');
        assert.equal(error, ':(', 'failure');
      });
  });

  test('#push should resolve all promises returned from `beforePush` before calling `_push`', function(assert) {
    assert.expect(7);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });
    const replaceAttributeTransform = buildTransform({ op: 'replaceRecordAttribute' });

    const resultingTransforms = [
      addRecordTransform,
      replaceAttributeTransform
    ];

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

    source._push = function() {
      assert.equal(++order, 4, '_push invoked after all `beforePush` handlers');
      return Promise.resolve(resultingTransforms);
    };

    source.on('push', () => {
      assert.equal(++order, 5, 'push triggered after action performed successfully');
    });

    return source.push(addRecordTransform)
      .then((result) => {
        assert.equal(++order, 6, 'promise resolved last');
        assert.deepEqual(result, resultingTransforms, 'applied transforms are returned on success');
      });
  });

  test('#push should not call `_push` if the transform has been applied as a result of `beforePush` resolution', function(assert) {
    assert.expect(2);

    let order = 0;

    const addRecordTransform = buildTransform({ op: 'addRecord' });

    source.on('beforePush', () => {
      assert.equal(++order, 1, 'beforePush triggered first');

      // source transformed
      source.transformLog.append(addRecordTransform.id);

      return Promise.resolve();
    });

    source._push = function() {
      assert.ok(false, '_push should not be reached');
    };

    source.on('push', () => {
      assert.ok(false, 'push should not be reached');
    });

    return source.push(addRecordTransform)
      .then(() => {
        assert.equal(++order, 2, 'promise resolved last');
      });
  });

  test('#push should resolve all promises returned from `beforePush` and fail if any fail', function(assert) {
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

    source._push = function() {
      assert.ok(false, '_push should not be invoked');
    };

    source.on('push', () => {
      assert.ok(false, 'push should not be triggered');
    });

    source.on('pushFail', () => {
      assert.equal(++order, 3, 'pushFail triggered after action failed');
    });

    return source.push(addRecordTransform)
      .catch((error) => {
        assert.equal(++order, 4, 'promise failed because no actions succeeded');
        assert.equal(error, ':(', 'failure');
      });
  });
});
