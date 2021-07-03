import { buildQuery } from '../src/query';
import { QueryTerm } from '../src/query-term';
import { FindRecords } from './support/record-data';
import {
  RecordQueryBuilder,
  RecordQueryExpression
} from './support/record-data';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('buildQuery', function () {
  test('can instantiate a query from an expression', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query = buildQuery(expression);
    assert.ok(query);
  });

  test('can instantiate a query that will be assigned an `id`', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query = buildQuery(expression);
    assert.ok(query.id, 'query has an id');
  });

  test('can instantiate a query with a single expression, options, and an id', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery(expression, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.strictEqual(
      query.expressions,
      expression,
      'expressions was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('can instantiate a query with an array of expressions, options, and an id', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let expressions = [expression];
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery(expressions, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(
      query.expressions,
      expressions,
      'expressions was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('can instantiate a query with a single query expression term, options, and an id', function (assert) {
    let term1 = {
      toQueryExpression: () => {
        return { op: 'findRecords', type: 'planet' };
      }
    } as QueryTerm<RecordQueryExpression>;
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery<RecordQueryExpression>(term1, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(
      query.expressions,
      { op: 'findRecords', type: 'planet' },
      'expressions was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('can instantiate a query with multiple query expression terms, options, and an id', function (assert) {
    let term1 = {
      toQueryExpression: () => {
        return { op: 'findRecords', type: 'planet' };
      }
    } as QueryTerm<RecordQueryExpression>;
    let term2 = {
      toQueryExpression: () => {
        return { op: 'findRecords', type: 'moon' };
      }
    } as QueryTerm<RecordQueryExpression>;
    let expressions = [term1, term2];
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery<RecordQueryExpression>(
      expressions,
      options,
      'abc123'
    );

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(
      query.expressions,
      [
        { op: 'findRecords', type: 'planet' },
        { op: 'findRecords', type: 'moon' }
      ],
      'expressions was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('will return a query passed into it if no options or id are passed', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query = buildQuery(expression);
    assert.strictEqual(buildQuery(query), query);
  });

  test('will return a new query if a query is passed as well as options / id', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query1 = buildQuery(expression, { a: '1', c: '1' }, '1');
    let query2 = buildQuery(query1, { a: '2', b: '2' }, '2');
    assert.notStrictEqual(query1, query2);
    assert.deepEqual(query2, {
      expressions: {
        op: 'findRecords',
        type: 'planet'
      },
      options: {
        a: '2',
        b: '2',
        c: '1'
      },
      id: '2'
    });
  });

  test('will create a query using a QueryBuilder if a function is passed into it', function (assert) {
    let qb = new RecordQueryBuilder();
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query = buildQuery<RecordQueryExpression, RecordQueryBuilder>(
      (q) => q.findRecords('planet'),
      undefined,
      undefined,
      qb
    );
    assert.deepEqual(
      query.expressions,
      expression,
      'expressions was populated'
    );
  });

  test('should call toQueryExpression() if available', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let queryFactory = new QueryTerm(expression);
    let query = buildQuery<RecordQueryExpression>(queryFactory);
    assert.strictEqual(
      query.expressions,
      expression,
      'expressions was populated'
    );
  });

  test('will create a query with multiple expressions', function (assert) {
    let expression1: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let expression2: FindRecords = {
      op: 'findRecords',
      type: 'moon'
    };
    let query = buildQuery<RecordQueryExpression>([expression1, expression2]);
    let qe = query.expressions as RecordQueryExpression[];
    assert.strictEqual(qe[0], expression1, 'expression1 was populated');
    assert.strictEqual(qe[1], expression2, 'expression2 was populated');
  });
});
