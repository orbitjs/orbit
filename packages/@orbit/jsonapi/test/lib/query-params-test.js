import { encodeQueryParams } from '../../src/lib/query-params';

const { module, test } = QUnit;

module('QueryParams', function() {
  module('encodeQueryParams', function() {
    test('empty', function(assert) {
      assert.strictEqual(
        encodeQueryParams(
          { }
        ),
        ''
      );
    });

    test('simple', function(assert) {
      assert.deepEqual(
        encodeQueryParams(
          { a: 'b' }
        ),
        'a=b'
      );
    });

    test('multiple', function(assert) {
      assert.deepEqual(
        encodeQueryParams(
          { a: 'b',
            b: 'c' }
        ),
        'a=b&b=c'
      );
    });

    test('multi-layered and encoded', function(assert) {
      assert.deepEqual(
        encodeQueryParams(
          {
            a: 'b',
            b: 'c',
            d: {
              e: 'f',
              g: {
                h: 'long sentence here'
              }
            }
          }
        ),
        'a=b&' +
        'b=c&' +
        encodeURIComponent('d[e]') + '=f&' +
        encodeURIComponent('d[g][h]') + '=' + encodeURIComponent('long sentence here')
      );
    });
  });
});
