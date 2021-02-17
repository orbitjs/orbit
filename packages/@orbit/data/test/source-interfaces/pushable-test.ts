import { ResponseHints } from '../../src/response';
import { Source } from '../../src/source';
import {
  isPushable,
  pushable,
  Pushable
} from '../../src/source-interfaces/pushable';
import { buildTransform, Transform } from '../../src/transform';
import {
  AddRecordOperation,
  RecordData,
  RecordOperation,
  RecordResponse,
  RecordTransformBuilder
} from '../support/record-data';

const { module, test } = QUnit;

module('@pushable', function (hooks) {
  interface MySource
    extends Source,
      Pushable<
        RecordData,
        RecordResponse,
        RecordOperation,
        RecordTransformBuilder
      > {}

  @pushable
  class MySource extends Source {}

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
    const fullResponse = {
      transforms: [addPlanet1, addPlanet2]
    };

    source.on('beforePush', (transform) => {
      assert.equal(++order, 1, 'beforePush triggered first');
      assert.strictEqual(transform, addPlanet1, 'transform matches');
    });

    source._push = async function (transform) {
      assert.equal(++order, 2, 'action performed after beforePush');
      assert.strictEqual(transform, addPlanet1, 'transform object matches');
      return fullResponse;
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
        fullResponse.transforms[transformCount++],
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
      fullResponse.transforms,
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

    const addPlanet1 = buildTransform<AddRecordOperation>({
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

    await source.push<AddRecordOperation>(addPlanet1);

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

  test('#push should pass a common `hints` object to all `beforePush` events and forward it to `_push`', async function (assert) {
    assert.expect(11);

    let order = 0;
    const updatePlanet1 = buildTransform<RecordOperation>({
      op: 'updateRecord',
      record: { type: 'planet', id: '1' }
    });
    const updatePlanet2 = buildTransform<RecordOperation>({
      op: 'updateRecord',
      record: { type: 'planet', id: '2' }
    });
    const fullResponse = {
      transforms: [updatePlanet1, updatePlanet2]
    };
    let h: ResponseHints<RecordData, RecordResponse>;

    source.on(
      'beforePush',
      async function (
        transform: Transform<RecordOperation>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 1, 'beforePush triggered first');
        assert.deepEqual(
          hints,
          {},
          'beforePush is passed empty `hints` object'
        );
        h = hints;
        hints.data = [
          { type: 'planet', id: 'venus' },
          { type: 'planet', id: 'mars' }
        ];
      }
    );

    source.on(
      'beforePush',
      async function (
        transform: Transform<RecordOperation>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 2, 'beforePush triggered second');
        assert.strictEqual(
          hints,
          h,
          'beforePush is passed same hints instance'
        );
      }
    );

    source.on(
      'beforePush',
      async function (
        transform: Transform<RecordOperation>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 3, 'beforePush triggered third');
        assert.strictEqual(
          hints,
          h,
          'beforePush is passed same hints instance'
        );
      }
    );

    source._push = async function (
      transform: Transform<RecordOperation>,
      hints?: ResponseHints<RecordData, RecordResponse>
    ) {
      assert.equal(
        ++order,
        4,
        '_query invoked after all `beforePush` handlers'
      );
      assert.strictEqual(hints, h, '_query is passed same hints instance');
      return { data: hints?.data, transforms: fullResponse.transforms };
    };

    source.on('push', async function () {
      assert.equal(
        ++order,
        5,
        'push triggered after action performed successfully'
      );
    });

    let result = await source.push(updatePlanet1);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(result, fullResponse.transforms, 'success!');
  });

  test('#push can return a full response, with `transforms` nested in a response object', async function (assert) {
    assert.expect(7);

    let order = 0;
    const updatePlanet1 = buildTransform<RecordOperation>({
      op: 'updateRecord',
      record: { type: 'planet', id: '1' }
    });
    const updatePlanet2 = buildTransform<RecordOperation>({
      op: 'updateRecord',
      record: { type: 'planet', id: '2' }
    });
    const fullResponse = {
      transforms: [updatePlanet1, updatePlanet2]
    };

    source._push = async function (transform) {
      assert.equal(++order, 1, 'action performed after beforePush');
      assert.deepEqual(
        transform.operations,
        updatePlanet1.operations,
        'operations match'
      );
      return fullResponse;
    };

    source.on('push', (transform, result) => {
      assert.equal(
        ++order,
        2,
        'push triggered after action performed successfully'
      );
      assert.deepEqual(
        transform.operations,
        updatePlanet1.operations,
        'operations match'
      );
      assert.deepEqual(result, fullResponse, 'result matches');
    });

    let result = await source.push(updatePlanet1, {
      fullResponse: true
    });

    assert.equal(++order, 3, 'promise resolved last');
    assert.deepEqual(result, fullResponse, 'success!');
  });

  test('#push can return a full response, with `transforms`, `details`, and `sources` nested in a response object', async function (assert) {
    assert.expect(9);

    let order = 0;
    const transform1 = buildTransform<RecordOperation>([
      {
        op: 'updateRecord',
        record: { type: 'planet', id: '1' }
      },
      {
        op: 'updateRecord',
        record: { type: 'planet', id: '2' }
      }
    ]);
    const data1 = [
      {
        type: 'planet',
        id: 'p1'
      }
    ];
    const details1 = {
      data: data1,
      links: {
        self: 'https://example.com/api/planets'
      }
    };
    const expectedResult = {
      transforms: [transform1],
      details: details1,

      // source-specific responses are based on beforePush responses
      sources: {
        remote: { details: details1 }
      }
    };

    source.on('beforePush', async (transform) => {
      assert.equal(++order, 1, 'beforePush triggered first');
      assert.strictEqual(
        transform.operations,
        transform1.operations,
        'beforePush: transform matches'
      );

      return ['remote', { details: details1 }];
    });

    source._push = async function (transform) {
      assert.equal(++order, 2, '_push performed after beforePush');
      assert.strictEqual(
        transform.operations,
        transform1.operations,
        '_push: transform matches'
      );
      return {
        transforms: [transform1],
        details: details1
      };
    };

    source.on('push', (transform, result) => {
      assert.equal(++order, 3, 'push triggered after action');
      assert.deepEqual(
        transform.operations,
        transform1.operations,
        'push: transform matches'
      );
      assert.deepEqual(result, expectedResult, 'push: result matches');
    });

    const result = await source.push(transform1, {
      fullResponse: true
    });

    assert.equal(++order, 4, 'request resolved last');
    assert.deepEqual(result, expectedResult, 'success!');
  });
});
