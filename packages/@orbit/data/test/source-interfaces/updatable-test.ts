import Orbit, {
  Source,
  updatable, isUpdatable,
  Transform
} from '../../src/index';
import '../test-helper';

const { Promise } = Orbit;
const { module, test } = QUnit;

module('@updatable', function(hooks) {
  let source;

  hooks.beforeEach(function() {
    @updatable
    class MySource extends Source {}

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

  test('#update should resolve as a failure when `transform` fails', function(assert) {
    assert.expect(2);

    source._update = function() {
      return Promise.reject(':(');
    };

    return source.update({ addRecord: {} })
      .catch((error) => {
        assert.ok(true, 'update promise resolved as a failure');
        assert.equal(error, ':(', 'failure');
      });
  });

  test('#update should trigger `update` event after a successful action in which `_update` returns an array of transforms', function(assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = Transform.from({ op: 'addRecord' });

    source.on('beforeUpdate', (transform) => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._update = function(transform) {
      assert.equal(++order, 2, 'action performed after beforeUpdate');
      assert.strictEqual(transform, addRecordTransform, 'transform object matches');
      return Promise.resolve(':)');
    };

    source.on('transform', (transform) => {
      assert.equal(++order, 3, 'transform triggered after action performed successfully');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return Promise.resolve();
    });

    source.on('update', (transform, result) => {
      assert.equal(++order, 4, 'update triggered after action performed successfully');
      assert.strictEqual(transform, addRecordTransform, 'update transform matches');
      assert.equal(result, ':)', 'result matches');
    });

    return source.update(addRecordTransform)
      .then(result => {
        assert.equal(++order, 5, 'promise resolved last');
        assert.equal(result, ':)', 'success!');
      });
  });

  test('`update` event should receive results as the last argument, even if they are an array', function(assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = Transform.from({ op: 'addRecord' });

    source.on('beforeUpdate', (transform) => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._update = function(transform) {
      assert.equal(++order, 2, 'action performed after beforeUpdate');
      assert.strictEqual(transform, addRecordTransform, 'transform object matches');
      return Promise.resolve(['a', 'b', 'c']);
    };

    source.on('transform', (transform) => {
      assert.equal(++order, 3, 'transform triggered after action performed successfully');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return Promise.resolve();
    });

    source.on('update', (transform, result) => {
      assert.equal(++order, 4, 'update triggered after action performed successfully');
      assert.strictEqual(transform, addRecordTransform, 'update transform matches');
      assert.deepEqual(result, ['a', 'b', 'c'], 'result matches');
    });

    return source.update(addRecordTransform)
      .then(result => {
        assert.equal(++order, 5, 'promise resolved last');
        assert.deepEqual(result, ['a', 'b', 'c'], 'success!');
      });
  });


  test('#update should trigger `updateFail` event after an unsuccessful update', function(assert) {
    assert.expect(7);

    const addRecordTransform = Transform.from({ op: 'addRecord' });

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
      assert.equal(++order, 2, 'updateFail triggered after an unsuccessful update');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      assert.equal(error, ':(', 'error matches');
    });

    return source.update(addRecordTransform)
      .catch((error) => {
        assert.equal(++order, 3, 'promise resolved last');
        assert.equal(error, ':(', 'failure');
      });
  });

  test('#update should resolve all promises returned from `beforeUpdate` before calling `_update`', function(assert) {
    assert.expect(6);

    let order = 0;

    const addRecordTransform = Transform.from({ op: 'addRecord' });

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

    source._update = function() {
      assert.equal(++order, 4, '_update invoked after all `beforeUpdate` handlers');
      return Promise.resolve();
    };

    source.on('update', () => {
      assert.equal(++order, 5, 'update triggered after action performed successfully');
    });

    return source.update(addRecordTransform)
      .then(() => {
        assert.equal(++order, 6, 'promise resolved last');
      });
  });

  test('#update should resolve all promises returned from `beforeUpdate` and fail if any fail', function(assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = Transform.from({ op: 'addRecord' });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      return Promise.resolve();
    });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 2, 'beforeUpdate triggered again');
      return Promise.reject(':(');
    });

    source._update = function() {
      assert.ok(false, '_update should not be invoked');
    };

    source.on('update', () => {
      assert.ok(false, 'update should not be triggered');
    });

    source.on('updateFail', () => {
      assert.equal(++order, 3, 'updateFail triggered after action failed');
    });

    return source.update(addRecordTransform)
      .catch((error) => {
        assert.equal(++order, 4, 'promise failed because no actions succeeded');
        assert.equal(error, ':(', 'failure');
      });
  });
});
