import 'tests/test-helper';
import Builder from 'orbit/query/builder';
import Query from 'orbit/query';
import { Value } from 'orbit/query/terms';
import { queryExpression as oqe } from 'orbit/query/expression';

///////////////////////////////////////////////////////////////////////////////

module('Orbit', function() {
  module('Query', function() {
    module('Builder', function(hooks) {
      let builder;

      hooks.beforeEach(() => {
        builder = new Builder({
          operators: {
            get(path) {
              return new Value(oqe('get', path));
            }
          }
        });
      });

      hooks.afterEach(() => {
        builder = null;
      });

      test('exists', function(assert) {
        assert.ok(builder, 'it exists');
      });

      test('#build - takes a function and returns a Query instance ', function(assert) {
        assert.expect(2);

        let query = builder.build(b => b.get('foo'));

        assert.ok(query instanceof Query, 'returns Query');
        assert.deepEqual(query.expression, oqe('get', 'foo'), 'query contains expression returned from builder');
      });
    });
  });
});
