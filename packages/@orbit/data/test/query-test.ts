import Query from '../src/query';
import { QueryTerm } from '../src/query-term';
import { FindRecords } from '../src/query-expression';
import QueryBuilder from '../src/query-builder';
import './test-helper';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('Query', function() {
  test('it exists', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = new Query(expression);
    assert.ok(query);
  });

  test('it is assigned an `id`', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = new Query(expression);
    assert.ok(query.id, 'query has an id');
  });

  test('can be created from with all attributes specified as options', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let options = { sources: { jsonapi: { include: 'comments' } }}
    let query = new Query(expression, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(query.expression, expression, 'expression was populated');
    assert.deepEqual(query.options, options, 'options was populated');
  });

  test('.from will return a query passed into it', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = new Query(expression);
    assert.strictEqual(Query.from(query), query);
  });

  test('.from will create a query from an expression passed into it', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords'
    };
    let query = Query.from(expression);
    assert.ok(query instanceof Query);
    assert.deepEqual(query.expression, expression, 'expression was populated');
  });

  test('.from will create a query using a QueryBuilder if a function is passed into it', function(assert) {
    let qb = new QueryBuilder();
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let query = Query.from(q => q.findRecords('planet'), null, null, qb);
    assert.ok(query instanceof Query);
    assert.deepEqual(query.expression, expression, 'expression was populated');
  });

  test('.from should call toQueryExpression() if available', function(assert) {
    let expression: FindRecords = {
      op: 'findRecords',
      type: 'planet'
    };
    let queryFactory = new QueryTerm(expression);
    let query = Query.from(queryFactory);
    assert.strictEqual(query.expression, expression, 'expression was populated');
  });
});
