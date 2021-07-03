import { ResponseHints } from '../../src/response';
import { Source } from '../../src/source';
import {
  isUpdatable,
  updatable,
  Updatable
} from '../../src/source-interfaces/updatable';
import { buildTransform, Transform } from '../../src/transform';
import {
  Record,
  RecordData,
  RecordOperation,
  RecordResponse,
  RecordTransformBuilder
} from '../support/record-data';

const { module, test } = QUnit;

module('@updatable', function (hooks) {
  interface MySource
    extends Source,
      Updatable<
        RecordData,
        RecordResponse,
        RecordOperation,
        RecordTransformBuilder
      > {}

  @updatable
  class MySource extends Source {}

  let source: MySource;

  hooks.beforeEach(function () {
    source = new MySource({
      name: 'src1',
      transformBuilder: new RecordTransformBuilder()
    });
  });

  test('isUpdatable - tests for the application of the @updatable decorator', function (assert) {
    assert.ok(isUpdatable(source));
  });

  test('should be applied to a Source', function (assert) {
    assert.throws(
      function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Test of bad typing
        @updatable
        class Vanilla {}
      },
      Error(
        'Assertion failed: Updatable interface can only be applied to a Source'
      ),
      'assertion raised'
    );
  });

  test('#update should resolve as a failure when `transform` fails', async function (assert) {
    assert.expect(2);

    source._update = function () {
      return Promise.reject(':(');
    };

    try {
      await source.update({
        op: 'addRecord',
        record: { type: 'planet', id: '1' }
      });
    } catch (error) {
      assert.ok(true, 'update promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#update should trigger `update` event after a successful action in which `_update` returns an array of transforms', async function (assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });
    const result1 = {
      type: 'planet',
      id: 'p1'
    };
    const fullResponse = { data: result1, transforms: [addRecordTransform] };

    source.on('beforeUpdate', (transform) => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
      return result1;
    });

    source._update = async function (transform: Transform<RecordOperation>) {
      assert.equal(++order, 2, 'action performed after beforeUpdate');
      assert.strictEqual(
        transform,
        addRecordTransform,
        'transform object matches'
      );
      return fullResponse;
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
      assert.deepEqual(result, fullResponse, 'result matches');
    });

    let result = await source.update<Record>(addRecordTransform);

    assert.equal(++order, 5, 'promise resolved last');
    assert.deepEqual(result, result1, 'success!');
  });

  test('#update can accept a transform builder function', async function (assert) {
    assert.expect(2);

    const earth = { type: 'planet', id: 'earth' };
    const fullResponse = { data: earth, transforms: [] };

    source._update = async function (transform: Transform<RecordOperation>) {
      assert.deepEqual(
        transform.operations as RecordOperation[],
        [
          {
            op: 'addRecord',
            record: earth
          }
        ],
        'transform passed to _update with correct operations'
      );
      return fullResponse;
    };

    let result = await source.update((t) => [t.addRecord(earth)]);

    assert.strictEqual(result, earth, 'expected data result');
  });

  test('`update` event should receive results as the last argument, even if they are an array', async function (assert) {
    assert.expect(11);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });
    const result1 = [
      {
        type: 'planet',
        id: 'p1'
      },
      {
        type: 'planet',
        id: 'p2'
      }
    ];
    const fullResponse = { data: result1, transforms: [addRecordTransform] };

    source.on('beforeUpdate', (transform) => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.strictEqual(transform, addRecordTransform, 'transform matches');
    });

    source._update = async function (transform) {
      assert.equal(++order, 2, 'action performed after beforeUpdate');
      assert.strictEqual(
        transform,
        addRecordTransform,
        'transform object matches'
      );
      return fullResponse;
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
      assert.deepEqual(result, fullResponse, 'result matches');
    });

    let result = await source.update(addRecordTransform);

    assert.equal(++order, 5, 'promise resolved last');
    assert.deepEqual(result, result1, 'success!');
  });

  test('#update should trigger `updateFail` event after an unsuccessful update', async function (assert) {
    assert.expect(7);

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });

    let order = 0;

    source._update = function (transform) {
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

  test('#update should resolve all promises returned from `beforeUpdate` before calling `_update`', async function (assert) {
    assert.expect(6);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });

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

    const result1 = [
      {
        type: 'planet',
        id: 'p1'
      }
    ];

    source._update = async function (transform: Transform<RecordOperation>) {
      assert.equal(
        ++order,
        4,
        '_update invoked after all `beforeUpdate` handlers'
      );
      return { data: result1 };
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

  test('#update should return early if the transform has already been applied', async function (assert) {
    assert.expect(2);

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });
    source.transformLog.append(addRecordTransform.id);

    source.on('beforeUpdate', async () => {
      assert.ok(false, 'beforeUpdate should not be triggered');
    });

    source._update = async function (transform) {
      assert.ok(false, '_update should not be reached');
      return { data: undefined };
    };

    source.on('update', () => {
      assert.ok(false, 'update should not be triggered');
    });

    const fullResponse = await source.update(addRecordTransform, {
      fullResponse: true
    });
    assert.deepEqual(fullResponse, { transforms: [] }, 'empty full response');

    const data = await source.update(addRecordTransform);
    assert.strictEqual(data, undefined, 'no data response');
  });

  test('#update should still call `_update` if the transform has been applied as a result of `beforeUpdate` resolution', async function (assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');

      // source transformed
      source.transformLog.append(addRecordTransform.id);

      return Promise.resolve();
    });

    const result1 = [
      {
        type: 'planet',
        id: 'p1'
      }
    ];

    source._update = async function (transform) {
      assert.ok(true, '_update should still be reached');
      assert.ok(
        this.transformLog.contains(transform.id),
        'transform is already contained in the log'
      );
      return { data: result1 };
    };

    source.on('update', () => {
      assert.ok(true, 'update should still be reached');
    });

    await source.update(addRecordTransform);

    assert.equal(++order, 2, 'promise resolved last');
  });

  test('#update should resolve all promises returned from `beforeUpdate` and fail if any fail', async function (assert) {
    assert.expect(5);

    let order = 0;

    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      return Promise.resolve();
    });

    source.on('beforeUpdate', () => {
      assert.equal(++order, 2, 'beforeUpdate triggered again');
      return Promise.reject(':(');
    });

    const result1 = [
      {
        type: 'planet',
        id: 'p1'
      }
    ];

    source._update = async function () {
      assert.ok(false, '_update should not be invoked');
      return { data: result1 };
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

  test('#update should pass a common `hints` object to all `beforeUpdate` events and forward it to `_update`', async function (assert) {
    assert.expect(11);

    let order = 0;
    const planet = { type: 'planet', id: 'p1' };
    const addRecordTransform = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: planet
    });
    let h: ResponseHints<RecordData, RecordResponse>;

    source.on(
      'beforeUpdate',
      async function (
        transform: Transform<RecordOperation>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 1, 'beforeUpdate triggered first');
        assert.deepEqual(
          hints,
          {},
          'beforeUpdate is passed empty `hints` object'
        );
        h = hints;
        hints.data = planet;
      }
    );

    source.on(
      'beforeUpdate',
      async function (
        transform: Transform<RecordOperation>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 2, 'beforeUpdate triggered second');
        assert.strictEqual(
          hints.data,
          planet,
          'beforeUpdate is passed same hints instance'
        );
      }
    );

    source.on(
      'beforeUpdate',
      async function (
        transform: Transform<RecordOperation>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 3, 'beforeUpdate triggered third');
        assert.strictEqual(
          hints.data,
          planet,
          'beforeUpdate is passed same hints instance'
        );
      }
    );

    source._update = async function (
      transform: Transform<RecordOperation>,
      hints?: ResponseHints<RecordData, RecordResponse>
    ) {
      assert.equal(
        ++order,
        4,
        '_update invoked after all `beforeUpdate` handlers'
      );
      assert.strictEqual(
        hints?.data,
        planet,
        '_update is passed same hints instance'
      );
      return { data: hints?.data };
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
      planet,
      'applied transforms are returned on success'
    );
  });

  test('#update can return a full response, with `data`, `details`, and `sources` nested in a response object', async function (assert) {
    assert.expect(9);

    let order = 0;
    const transform1 = buildTransform<RecordOperation>({
      op: 'addRecord',
      record: { type: 'planet', id: '1' }
    });
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
      data: data1,
      details: details1,

      // source-specific responses are based on beforeQuery responses
      sources: {
        remote: { details: details1 }
      }
    };

    source.on('beforeUpdate', async (transform) => {
      assert.equal(++order, 1, 'beforeUpdate triggered first');
      assert.strictEqual(
        transform.operations,
        transform1.operations,
        'beforeUpdate: transform matches'
      );

      return ['remote', { details: details1 }];
    });

    source._update = async function (transform) {
      assert.equal(++order, 2, '_update performed after beforeUpdate');
      assert.strictEqual(
        transform.operations,
        transform1.operations,
        '_update: transform matches'
      );
      return { data: data1, details: details1 };
    };

    source.on('update', (transform, result) => {
      assert.equal(++order, 3, 'update triggered after action');
      assert.strictEqual(
        transform.operations,
        transform1.operations,
        'update: transform matches'
      );
      assert.deepEqual(result, expectedResult, 'update: result matches');
    });

    let result = await source.update<Record[]>(transform1, {
      fullResponse: true
    });

    assert.equal(++order, 4, 'request resolved last');
    assert.deepEqual(result, expectedResult, 'success!');
  });
});
