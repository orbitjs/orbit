import { arrayToOptions } from '../../src/lib/config';

const { module, test } = QUnit;

module('Lib / Config', function() {
  test('`arrayToOptions` converts an array to an options hash', function(assert) {
    assert.deepEqual(arrayToOptions(), {}, 'no args return empty hash');
    assert.deepEqual(arrayToOptions([]), {}, 'empty array returns empty hash');
    assert.deepEqual(arrayToOptions(['a', 'b']), { a: true, b: true }, 'items in array are converted to items in hash');
  });
});
