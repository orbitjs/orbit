import { spread } from 'orbit/lib/functions';

module('Orbit - Lib - Functions', {
});

test('`spread` wraps a function that expects parameters with another that can accept the parameters as an array', function() {
  expect(3);

  var f = function(a, b, c) {
    equal(a, 'a');
    equal(b, 'b');
    equal(c, 'c');
  };

  spread(f)(['a', 'b', 'c']);
});
