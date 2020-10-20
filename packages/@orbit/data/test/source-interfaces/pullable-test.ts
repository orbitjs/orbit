import { Query, QueryOrExpressions } from '../../src/query';
import { Source } from '../../src/source';
import { buildTransform } from '../../src/transform';
import { RequestOptions } from '../../src/request';
import {
  pullable,
  isPullable,
  Pullable
} from '../../src/source-interfaces/pullable';
import { FullResponse, TransformsOrFullResponse } from '../../src/response';
import {
  FindRecords,
  RecordResponse,
  RecordOperation,
  RecordQueryExpression,
  RecordQueryBuilder
} from '../support/record-data';

const { module, test } = QUnit;

module('@pullable', function (hooks) {
  @pullable
  class MySource
    extends Source
    implements
      Pullable<
        RecordResponse,
        RecordOperation,
        RecordQueryExpression,
        RecordQueryBuilder
      > {
    pull!: (
      queryOrExpressions: QueryOrExpressions<
        RecordQueryExpression,
        RecordQueryBuilder
      >,
      options?: RequestOptions,
      id?: string
    ) => Promise<
      TransformsOrFullResponse<undefined, RecordResponse, RecordOperation>
    >;

    _pull!: (
      query: Query<RecordQueryExpression>
    ) => Promise<FullResponse<undefined, RecordResponse, RecordOperation>>;
  }

  let source: MySource;

  hooks.beforeEach(function () {
    source = new MySource();
  });

  test('isPullable - tests for the application of the @pullable decorator', function (assert) {
    assert.ok(isPullable(source));
  });

  test('should be applied to a Source', function (assert) {
    assert.throws(
      function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Test of bad typing
        @pullable
        class Vanilla {}
      },
      Error(
        'Assertion failed: Pullable interface can only be applied to a Source'
      ),
      'assertion raised'
    );
  });

  test('#pull should resolve as a failure when _pull fails', async function (assert) {
    assert.expect(2);

    source._pull = async function () {
      return Promise.reject(':(');
    };

    try {
      await source.pull({ op: 'findRecords', type: 'planet' });
    } catch (error) {
      assert.ok(true, 'pull promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#pull should trigger `pull` event after a successful action in which `_pull` returns an array of transforms', async function (assert) {
    assert.expect(9);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;

    const resultingTransforms = [
      buildTransform<RecordOperation>({
        op: 'updateRecord',
        record: { type: 'planet', id: '1' }
      }),
      buildTransform<RecordOperation>({
        op: 'updateRecord',
        record: { type: 'planet', id: '2' }
      })
    ];

    source._pull = async function (query) {
      assert.equal(++order, 1, 'action performed after willPull');
      assert.strictEqual(query.expressions[0], qe, 'query object matches');
      await this.transformed(resultingTransforms);
      return { transforms: resultingTransforms };
    };

    let transformCount = 0;
    source.on('transform', (transform) => {
      assert.strictEqual(
        transform,
        resultingTransforms[transformCount++],
        'transform matches'
      );
      return Promise.resolve();
    });

    source.on('pull', (query, result) => {
      assert.equal(
        ++order,
        2,
        'pull triggered after action performed successfully'
      );
      assert.strictEqual(query.expressions[0], qe, 'query matches');
      assert.strictEqual(result, resultingTransforms, 'result matches');
    });

    let result = await source.pull(qe);

    assert.equal(++order, 3, 'promise resolved last');
    assert.strictEqual(result, resultingTransforms, 'success!');
  });

  test('#pull should resolve all promises returned from `beforePull` before calling `_transform`', async function (assert) {
    assert.expect(12);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;

    const resultingTransforms = [
      buildTransform<RecordOperation>({
        op: 'updateRecord',
        record: { type: 'planet', id: '1' }
      }),
      buildTransform<RecordOperation>({
        op: 'updateRecord',
        record: { type: 'planet', id: '2' }
      })
    ];

    source.on('beforePull', () => {
      assert.equal(++order, 1, 'beforePull triggered first');
      return Promise.resolve();
    });

    source.on('beforePull', () => {
      assert.equal(++order, 2, 'beforePull triggered second');
      return undefined;
    });

    source.on('beforePull', () => {
      assert.equal(++order, 3, 'beforePull triggered third');
      return Promise.resolve();
    });

    source._pull = async function (query) {
      assert.equal(++order, 4, 'action performed after willPull');
      assert.strictEqual(query.expressions[0], qe, 'query object matches');
      await this.transformed(resultingTransforms);
      return { transforms: resultingTransforms };
    };

    let transformCount = 0;
    source.on('transform', (transform) => {
      assert.strictEqual(
        transform,
        resultingTransforms[transformCount++],
        'transform matches'
      );
      return Promise.resolve();
    });

    source.on('pull', (query, result) => {
      assert.equal(
        ++order,
        5,
        'pull triggered after action performed successfully'
      );
      assert.strictEqual(query.expressions[0], qe, 'query matches');
      assert.strictEqual(result, resultingTransforms, 'result matches');
    });

    let result = await source.pull(qe);

    assert.equal(++order, 6, 'promise resolved last');
    assert.strictEqual(result, resultingTransforms, 'success!');
  });

  test('#pull should resolve all promises returned from `beforePull` and fail if any fail', async function (assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;

    source.on('beforePull', () => {
      assert.equal(++order, 1, 'beforePull triggered third');
      return Promise.resolve();
    });

    source.on('beforePull', () => {
      assert.equal(++order, 2, 'beforePull triggered third');
      return Promise.reject(':(');
    });

    source._pull = async function (query) {
      assert.ok(false, '_pull should not be invoked');
      return { transforms: [] };
    };

    source.on('pull', () => {
      assert.ok(false, 'pull should not be triggered');
    });

    source.on('pullFail', (query, error) => {
      assert.equal(
        ++order,
        3,
        'pullFail triggered after an unsuccessful beforePull'
      );
      assert.strictEqual(query.expressions[0], qe, 'query matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.pull(qe);
    } catch (error) {
      assert.equal(++order, 4, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#pull should trigger `pullFail` event after an unsuccessful pull', async function (assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;

    source._pull = function (query) {
      assert.equal(++order, 1, 'action performed after willPull');
      assert.strictEqual(query.expressions[0], qe, 'query object matches');
      return Promise.reject(':(');
    };

    source.on('pull', () => {
      assert.ok(false, 'pull should not be triggered');
    });

    source.on('pullFail', (query, error) => {
      assert.equal(++order, 2, 'pullFail triggered after an unsuccessful pull');
      assert.strictEqual(query.expressions[0], qe, 'query matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.pull(qe);
    } catch (error) {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });
});
