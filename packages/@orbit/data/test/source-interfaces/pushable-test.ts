import {
  buildTransform,
  Transform,
  TransformOrOperations
} from '../../src/transform';
import { Source } from '../../src/source';
import { RequestOptions } from '../../src/request';
import { FullResponse, TransformsOrFullResponse } from '../../src/response';
import {
  pushable,
  isPushable,
  Pushable
} from '../../src/source-interfaces/pushable';
import {
  RecordResponse,
  RecordOperation,
  RecordTransformBuilder
} from '../support/record-data';

const { module, test } = QUnit;

module('@pushable', function (hooks) {
  @pushable
  class MySource
    extends Source
    implements
      Pushable<RecordResponse, RecordOperation, RecordTransformBuilder> {
    push!: (
      transformOrOperations: TransformOrOperations<
        RecordOperation,
        RecordTransformBuilder
      >,
      options?: RequestOptions,
      id?: string
    ) => Promise<
      TransformsOrFullResponse<undefined, RecordResponse, RecordOperation>
    >;
    _push!: (
      transform: Transform
    ) => Promise<FullResponse<undefined, RecordResponse, RecordOperation>>;
  }

  let source: MySource;

  hooks.beforeEach(function () {
    source = new MySource({ name: 'src1' });
  });

  test('isPushable - tests for the application of the @pushable decorator', function (assert) {
    assert.ok(isPushable(source));
  });

  test('should be applied to a Source', function (assert) {
    assert.throws(
      function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Test of bad typing
        @pushable
        class Vanilla {}
      },
      Error(
        'Assertion failed: Pushable interface can only be applied to a Source'
      ),
      'assertion raised'
    );
  });

  test('#push should resolve as a failure when `transform` fails', async function (assert) {
    assert.expect(2);

    source._push = function () {
      return Promise.reject(':(');
    };

    try {
      await source.push({
        op: 'addRecord',
        record: { type: 'planet', id: '1' }
      });
    } catch (error) {
      assert.ok(true, 'push promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#push should trigger `push` event after a successful action in which `transform` returns an array of transforms', async function (assert) {
    assert.expect(12);

    let order = 0;

    const addPlanet1 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });
    const addPlanet2 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '2' }
    });

    const resultingTransforms = [addPlanet1, addPlanet2];

    source.on('beforePush', (transform) => {
      assert.equal(++order, 1, 'beforePush triggered first');
      assert.strictEqual(transform, addPlanet1, 'transform matches');
    });

    source._push = async function (transform) {
      assert.equal(++order, 2, 'action performed after beforePush');
      assert.strictEqual(transform, addPlanet1, 'transform object matches');
      await this.transformed(resultingTransforms);
      return { transforms: resultingTransforms };
    };

    let transformCount = 0;
    source.on('transform', (transform) => {
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

    source.on('push', (transform) => {
      assert.equal(
        ++order,
        5,
        'push triggered after action performed successfully'
      );
      assert.strictEqual(transform, addPlanet1, 'transform matches');
    });

    let result = await source.push(addPlanet1);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(
      result,
      resultingTransforms,
      'applied transforms are returned on success'
    );
  });

  test('#push should trigger `pushFail` event after an unsuccessful push', async function (assert) {
    assert.expect(7);

    const addPlanet1 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });

    let order = 0;

    source._push = function (transform) {
      assert.equal(++order, 1, 'action performed after willPush');
      assert.strictEqual(transform, addPlanet1, 'transform matches');
      return Promise.reject(':(');
    };

    source.on('push', () => {
      assert.ok(false, 'push should not be triggered');
    });

    source.on('pushFail', (transform, error) => {
      assert.equal(++order, 2, 'pushFail triggered after an unsuccessful push');
      assert.strictEqual(transform, addPlanet1, 'transform matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.push(addPlanet1);
    } catch (error) {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#push should resolve all promises returned from `beforePush` before calling `_push`', async function (assert) {
    assert.expect(7);

    let order = 0;

    const addPlanet1 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });
    const addPlanet2 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '2' }
    });

    const resultingTransforms = [addPlanet1, addPlanet2];

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

    source._push = async function () {
      assert.equal(++order, 4, '_push invoked after all `beforePush` handlers');
      return { transforms: resultingTransforms };
    };

    source.on('push', () => {
      assert.equal(
        ++order,
        5,
        'push triggered after action performed successfully'
      );
    });

    let result = await source.push(addPlanet1);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(
      result,
      resultingTransforms,
      'applied transforms are returned on success'
    );
  });

  test('#push should still call `_push` if the transform has been applied as a result of `beforePush` resolution', async function (assert) {
    assert.expect(5);

    let order = 0;

    const addPlanet1 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });

    source.on('beforePush', () => {
      assert.equal(++order, 1, 'beforePush triggered first');

      // source transformed
      source.transformLog.append(addPlanet1.id);

      return Promise.resolve();
    });

    source._push = async function () {
      assert.ok(true, '_push should still be reached');
      assert.ok(
        this.transformLog.contains(addPlanet1.id),
        'transform is already contained in the log'
      );
      return { transforms: [] };
    };

    source.on('push', () => {
      assert.ok(true, 'push should still be reached');
    });

    await source.push(addPlanet1);

    assert.equal(++order, 2, 'promise resolved last');
  });

  test('#push should resolve all promises returned from `beforePush` and fail if any fail', async function (assert) {
    assert.expect(5);

    let order = 0;

    const addPlanet1 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });

    source.on('beforePush', () => {
      assert.equal(++order, 1, 'beforePush triggered first');
      return Promise.resolve();
    });

    source.on('beforePush', () => {
      assert.equal(++order, 2, 'beforePush triggered again');
      return Promise.reject(':(');
    });

    source._push = async function () {
      assert.ok(false, '_push should not be invoked');
      return { transforms: [] };
    };

    source.on('push', () => {
      assert.ok(false, 'push should not be triggered');
    });

    source.on('pushFail', () => {
      assert.equal(++order, 3, 'pushFail triggered after action failed');
    });

    try {
      await source.push(addPlanet1);
    } catch (error) {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    }
  });
});
