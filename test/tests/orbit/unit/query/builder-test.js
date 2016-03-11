import 'tests/test-helper';
import Builder from 'orbit/query/builder';
import Query from 'orbit/query';
import { queryExpression as oqe } from 'orbit/query/expression';

///////////////////////////////////////////////////////////////////////////////

let builder;

module('Orbit', function() {
  module('Query', function() {
    module('Builder', {
      setup() {
        builder = new Builder();
      },

      teardown() {
        builder = null;
      }
    }, function() {
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
