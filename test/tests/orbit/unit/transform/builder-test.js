import 'tests/test-helper';
import Builder from 'orbit/transform/builder';
import Transform from 'orbit/transform';

///////////////////////////////////////////////////////////////////////////////

let builder;

module('Orbit', function() {
  module('Transform', function() {
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

      test('#build - takes a function and returns a Transform instance (empty by default)', function(assert) {
        assert.expect(3);

        let transform = builder.build(t => {
          assert.deepEqual(t.operations, [], 'transform builder has no operations');
        });

        assert.ok(transform instanceof Transform, 'a Transform instance is returned');
        assert.deepEqual(transform.operations, [], 'built transform has no operations');
      });
    });
  });
});
