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

        let t = builder.build((b) => {
          assert.ok(b.transform instanceof Transform);
        });

        assert.ok(t instanceof Transform);
        assert.deepEqual(t.operations, [], 'has no operations by default');
      });
    });
  });
});
