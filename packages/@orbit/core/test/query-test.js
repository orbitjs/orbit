import Query from '../src/query';
import { QueryTerm } from '../src/query-term';
import { queryExpression as oqe } from '../src/query-expression';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('Query', function() {
  test('it exists', function(assert) {
    let query = new Query();
    assert.ok(query);
  });

  test('it is assigned an `id`', function(assert) {
    let query = new Query();
    assert.ok(query.id, 'query has an id');
  });

  test('can be created from with all attributes specified as options', function(assert) {
    let expression = { op: 'foo' };
    let options = { sources: { jsonapi: { include: 'comments' } }}
    let query = new Query(expression, options, 'abc123');

    assert.strictEqual(query.id, 'abc123', 'id was populated');
    assert.deepEqual(query.expression, expression, 'expression was populated');
    assert.deepEqual(query.options, options, 'options was populated');
  });

  test('.from will return a query passed into it', function(assert) {
    let query = new Query();
    assert.strictEqual(Query.from(query), query);
  });

  test('.from will create a query from an expression passed into it', function(assert) {
    const expression = { op: 'foo' };
    const query = Query.from(expression);
    assert.ok(query instanceof Query);
    assert.deepEqual(query.expression, expression, 'expression was populated');
  });

  test('.from should call toQueryExpression() if available', function(assert) {
    const expression = oqe('records', 'planet');
    const queryFactory = new QueryTerm(expression);
    const query = Query.from(queryFactory);
    assert.deepEqual(query.expression, expression, 'expression was populated');
  });
});
