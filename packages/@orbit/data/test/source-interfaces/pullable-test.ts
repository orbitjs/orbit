import {
  Query,
  QueryOrExpression,
  Source,
  Transform,
  pullable,
  isPullable,
  buildTransform,
  Pullable
} from '../../src/index';
import '../test-helper';

const { module, test } = QUnit;

module('@pullable', function(hooks) {
  @pullable
  class MySource extends Source implements Pullable {
    pull: (
      queryOrExpression: QueryOrExpression,
      options?: object,
      id?: string
    ) => Promise<Transform[]>;
    _pull: (query: Query, hints?: any) => Promise<Transform[]>;
  }

  let source: MySource;

  hooks.beforeEach(function() {
    source = new MySource();
  });

  hooks.afterEach(function() {
    source = null;
  });

  test('isPullable - tests for the application of the @pullable decorator', function(assert) {
    assert.ok(isPullable(source));
  });

  // TODO
  // test('should be applied to a Source', function(assert) {
  //   assert.throws(function() {
  //     @pullable
  //     class Vanilla {}
  //   },
  //   Error('Assertion failed: Pullable interface can only be applied to a Source'),
  //   'assertion raised');
  // });

  test('#pull should resolve as a failure when _pull fails', async function(assert) {
    assert.expect(2);

    source._pull = async function() {
      return Promise.reject(':(');
    };

    try {
      await source.pull(q => q.findRecords('planet'));
    } catch (error) {
      assert.ok(true, 'pull promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#pull should trigger `pull` event after a successful action in which `_pull` returns an array of transforms', async function(assert) {
    assert.expect(9);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    const resultingTransforms = [
      buildTransform({ op: 'addRecord' }),
      buildTransform({ op: 'replaceRecordAttribute' })
    ];

    source._pull = async function(query) {
      assert.equal(++order, 1, 'action performed after willPull');
      assert.strictEqual(query.expression, qe, 'query object matches');
      await this.transformed(resultingTransforms);
      return resultingTransforms;
    };

    let transformCount = 0;
    source.on('transform', transform => {
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
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.strictEqual(result, resultingTransforms, 'result matches');
    });

    let result = await source.pull(qe);

    assert.equal(++order, 3, 'promise resolved last');
    assert.strictEqual(result, resultingTransforms, 'success!');
  });

  test('#pull should resolve all promises returned from `beforePull` before calling `_transform`', async function(assert) {
    assert.expect(12);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    const resultingTransforms = [
      buildTransform({ op: 'addRecord' }),
      buildTransform({ op: 'replaceRecordAttribute' })
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

    source._pull = async function(query) {
      assert.equal(++order, 4, 'action performed after willPull');
      assert.strictEqual(query.expression, qe, 'query object matches');
      await this.transformed(resultingTransforms);
      return resultingTransforms;
    };

    let transformCount = 0;
    source.on('transform', transform => {
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
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.strictEqual(result, resultingTransforms, 'result matches');
    });

    let result = await source.pull(qe);

    assert.equal(++order, 6, 'promise resolved last');
    assert.strictEqual(result, resultingTransforms, 'success!');
  });

  test('#pull should resolve all promises returned from `beforePull` and fail if any fail', async function(assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    source.on('beforePull', () => {
      assert.equal(++order, 1, 'beforePull triggered third');
      return Promise.resolve();
    });

    source.on('beforePull', () => {
      assert.equal(++order, 2, 'beforePull triggered third');
      return Promise.reject(':(');
    });

    source._pull = async function(query: Query): Promise<Transform[]> {
      assert.ok(false, '_pull should not be invoked');
      return [];
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
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.pull(qe);
    } catch (error) {
      assert.equal(++order, 4, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#pull should trigger `pullFail` event after an unsuccessful pull', async function(assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    source._pull = function(query) {
      assert.equal(++order, 1, 'action performed after willPull');
      assert.strictEqual(query.expression, qe, 'query object matches');
      return Promise.reject(':(');
    };

    source.on('pull', () => {
      assert.ok(false, 'pull should not be triggered');
    });

    source.on('pullFail', (query, error) => {
      assert.equal(++order, 2, 'pullFail triggered after an unsuccessful pull');
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.pull(qe);
    } catch (error) {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#pull should pass a common `hints` object to all `beforePull` events and forward it to `_pull`', async function(assert) {
    assert.expect(16);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };
    let h: any;
    const resultingTransforms = [
      buildTransform({ op: 'addRecord' }),
      buildTransform({ op: 'replaceRecordAttribute' })
    ];

    source.on('beforePull', async function(query: Query, hints: any) {
      assert.equal(++order, 1, 'beforePull triggered first');
      assert.deepEqual(hints, {}, 'beforePull is passed empty `hints` object');
      h = hints;
      hints.data = resultingTransforms;
    });

    source.on('beforePull', async function(query: Query, hints: any) {
      assert.equal(++order, 2, 'beforePull triggered second');
      assert.strictEqual(hints, h, 'beforePull is passed same hints instance');
    });

    source.on('beforePull', async function(query: Query, hints: any) {
      assert.equal(++order, 3, 'beforePull triggered third');
      assert.strictEqual(hints, h, 'beforePull is passed same hints instance');
    });

    source._pull = async function(query: Query, hints: any) {
      assert.equal(++order, 4, 'action performed after willPull');
      assert.strictEqual(query.expression, qe, 'query object matches');
      assert.strictEqual(hints, h, '_pull is passed same hints instance');
      await this.transformed(resultingTransforms);
      return hints.data;
    };

    let transformCount = 0;
    source.on('transform', async function(transform) {
      assert.strictEqual(
        transform,
        resultingTransforms[transformCount++],
        'transform matches'
      );
    });

    source.on('pull', (query, result) => {
      assert.equal(
        ++order,
        5,
        'pull triggered after action performed successfully'
      );
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.strictEqual(result, resultingTransforms, 'result matches');
    });

    let result = await source.pull(qe);

    assert.equal(++order, 6, 'promise resolved last');
    assert.strictEqual(result, resultingTransforms, 'success!');
  });
});
