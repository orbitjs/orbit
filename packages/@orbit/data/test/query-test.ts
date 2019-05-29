import { buildQuery } from '../src/query';
import { QueryTerm } from '../src/query-term';
import { FindRecords } from '../src/query-expression';
import QueryBuilder from '../src/query-builder';
import './test-helper';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('buildQuery', function() {
  test('can instantiate a query from an expression', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = buildQuery(expression);
    assert.ok(query);
  });

  test('can instantiate a query that will be assigned an `id`', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = buildQuery(expression);
    assert.ok(query.id, 'query has an id');
  });

  test('can instantiate a query with an expression, options, and an id', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let query = buildQuery(expression, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.strictEqual(
      query.expression,
      expression,
      'expression was populated'
    );
    assert.strictEqual(query.options, options, 'options was populated');
  });

  test('will return a query passed into it', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = buildQuery(expression);
    assert.strictEqual(buildQuery(query), query);
  });

  test('will create a query using a QueryBuilder if a function is passed into it', function(assert) {
    let qb = new QueryBuilder();
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query = buildQuery(q => q.findRecords('planet'), null, null, qb);
    assert.deepEqual(query.expression, expression, 'expression was populated');
  });

  test('should call toQueryExpression() if available', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let queryFactory = new QueryTerm(expression);
    let query = buildQuery(queryFactory);
    assert.strictEqual(
      query.expression,
      expression,
      'expression was populated'
    );
  });
});
