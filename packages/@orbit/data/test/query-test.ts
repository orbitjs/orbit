import { buildQuery } from '../src/query';
import { QueryTerm } from '../src/query-term';
import { FindRecords } from '../src/query-expression';
import { QueryBuilder } from '../src/query-builder';
import './test-helper';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('buildQuery', function () {
  test('can instantiate a query from an expression', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = buildQuery(expression);
    assert.ok(query);
  });

  test('can instantiate a query that will be assigned an `id`', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = buildQuery(expression);
    assert.ok(query.id, 'query has an id');
  });

  test('can instantiate a query with a single expression, options, and an id', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery(expression, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.strictEqual(
      query.expressions[0],
      expression,
      'expression was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('can instantiate a query with an array of expressions, options, and an id', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let expressions = [expression];
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery(expression, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(
      query.expressions,
      expressions,
      'expression was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('can instantiate a query with a single query expression term, options, and an id', function (assert) {
    let term1 = {
      toQueryExpression: () => {
        return { op: 'findRecords' };
      }
    } as QueryTerm;
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery(term1, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(
      query.expressions,
      [{ op: 'findRecords' }],
      'expression was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('can instantiate a query with a single query expression term, options, and an id', function (assert) {
    let term1 = {
      toQueryExpression: () => {
        return { op: 'findRecords' };
      }
    } as QueryTerm;
    let term2 = {
      toQueryExpression: () => {
        return { op: 'findRecord' };
      }
    } as QueryTerm;
    let expressions = [term1, term2];
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery(expressions, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(
      query.expressions,
      [{ op: 'findRecords' }, { op: 'findRecord' }],
      'expression was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('will return a query passed into it', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = buildQuery(expression);
    assert.strictEqual(buildQuery(query), query);
  });

  test('will create a query using a QueryBuilder if a function is passed into it', function (assert) {
    let qb = new QueryBuilder();
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query = buildQuery((q) => q.findRecords('planet'), null, null, qb);
    assert.deepEqual(
      query.expressions[0],
      expression,
      'expression was populated'
    );
  });

  test('should call toQueryExpression() if available', function (assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let queryFactory = new QueryTerm(expression);
    let query = buildQuery(queryFactory);
    assert.strictEqual(
      query.expressions[0],
      expression,
      'expression was populated'
    );
  });

  test('will create a query with multiple expressions', function (assert) {
    let expression1: FindRecords = {
      op: 'findRecords'
    };
    let expression2: FindRecords = {
      op: 'findRecords'
    };
    let query = buildQuery([expression1, expression2]);
    assert.strictEqual(
      query.expressions[0],
      expression1,
      'expression1 was populated'
    );
    assert.strictEqual(
      query.expressions[1],
      expression2,
      'expression2 was populated'
    );
  });
});
