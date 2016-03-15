import Orbit from 'orbit/main';
import Query from 'orbit/query';
import Builder from 'orbit/query/builder';
import { Value } from 'orbit/query/terms';
import { queryExpression as oqe } from 'orbit/query/expression';
import { QueryBuilderNotRegisteredException } from 'orbit/lib/exceptions';

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

    test('can be created from with all attributes specified as options', function(assert) {
      let expression = { op: 'foo' };
      let options = { id: 'abc123' };

      let query = new Query(expression, options);

      assert.strictEqual(query.id, options.id, 'id was populated');
      assert.deepEqual(query.expression, expression, 'expression was populated');
    });

    test('.from will return a query passed into it', function(assert) {
      let query = new Query();
      assert.strictEqual(Query.from(query), query);
    });

    test('.from will create a query from an expression passed into it', function(assert) {
      let query = Query.from({ op: 'foo' });
      assert.ok(query instanceof Query);
    });

    test('.from should pass any query functions to queryBuilder, if one is passed', function(assert) {
      assert.expect(2);

      const operators = {
        get(path) {
          return new Value(oqe('get', path));
        },

        or(a, b) {
          return oqe('or', a, b);
        },

        and(a, b) {
          return oqe('and', a, b);
        }
      };

      const queryBuilder = new Builder({ operators });

      let query = Query.from(
        (q) => q.get('foo'),
        queryBuilder
      );

      assert.ok(query instanceof Query, 'built a Query');
      assert.deepEqual(query.expression, oqe('get', 'foo'), 'query contains expression returned from builder');
    });

    test('.from should throw an exception if a function is passed but a queryBuilder is not', function(assert) {
      assert.throws(
        () => {
          Query.from((b) => {});
        },
        QueryBuilderNotRegisteredException
      );
    });
  });
});
