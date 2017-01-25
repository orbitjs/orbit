import { spread } from '../../src/lib/functions';

const { module, test } = QUnit;

module('Lib / Functions', function() {
  test('`spread` wraps a function that expects parameters with another that can accept the parameters as an array', function(assert) {
    assert.expect(3);

    var f = function(a, b, c) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      assert.equal(c, 'c');
    };

    spread(f)(['a', 'b', 'c']);
  });
});
