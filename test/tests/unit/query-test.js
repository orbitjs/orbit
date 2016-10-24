import Query from 'orbit/query';
import { queryExpression as oqe } from 'orbit/query/expression';

///////////////////////////////////////////////////////////////////////////////

module('Orbit', function() {
  module('Query', function() {
    test('it exists', function(assert) {
      let query = new Query();
      assert.ok(query);
    });

    test('it is assigned an `id`', function(assert) {
      let query = new Query();
      assert.ok(query.id, 'query has an id');
    });

    test('it is assigned an empty `sources`', function(assert) {
      let query = new Query();
      assert.deepEqual(query.sources, {}, 'query has empty sources');
    });

    test('can be created from with all attributes specified as options', function(assert) {
      let expression = { op: 'foo' };
      let options = {
        id: 'abc123',
        sources: {
          jsonapi: {
            include: 'bar'
          }
        }
      };

      let query = new Query(expression, options);

      assert.strictEqual(query.id, options.id, 'id was populated');
      assert.strictEqual(query.sources, options.sources, 'sources was populated');
      assert.deepEqual(query.expression, expression, 'expression was populated');
    });

    test('.from will return a query passed into it', function(assert) {
      let query = new Query();
      assert.strictEqual(Query.from(query), query);
    });

    test('.from will create a query from an expression passed into it', function(assert) {
      const expression = { op: 'foo' };
      const options = { sources: { jsonapi: { include: 'bar' } } };
      const query = Query.from(expression, options);
      assert.ok(query instanceof Query);
      assert.deepEqual(query.expression, expression, 'expression was populated');
      assert.deepEqual(query.sources, options.sources, 'sources was populated');
    });

    test('.from should call toQueryExpression() if available', function(assert) {
      const expression = oqe('records', 'planet');
      const options = { sources: { jsonapi: { include: 'bar' } } };
      const queryFactory = {
        toQueryExpression() {
          return expression;
        }
      };

      const query = Query.from(queryFactory, options);
      assert.deepEqual(query.expression, expression, 'expression was populated');
      assert.deepEqual(query.sources, options.sources, 'sources was populated');
    });
  });
});
