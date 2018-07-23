import { encodeQueryParams, appendQueryParams } from '../../src/lib/query-params';

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

    test('null value', function(assert) {
      assert.deepEqual(
        encodeQueryParams(
          { a: null }
        ),
        'a=null'
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
                h: 'long sentence here',
                i: null
              }
            }
          }
        ),
        'a=b&' +
        'b=c&' +
        encodeURIComponent('d[e]') + '=f&' +
        encodeURIComponent('d[g][h]') + '=' + encodeURIComponent('long sentence here') + '&' +
        encodeURIComponent('d[g][i]') + '=null'
      );
    });
  });

  module('appendQueryParams', function() {
    test('empty', function(assert) {
      assert.strictEqual(
        appendQueryParams(
          'http://example.com',
          { }
        ),
        'http://example.com'
      );
    });

    test('simple', function(assert) {
      assert.strictEqual(
        appendQueryParams(
          'http://example.com',
          { a: 'b' }
        ),
        'http://example.com?a=b'
      );
    });

    test('appended to existing query params', function(assert) {
      assert.strictEqual(
        appendQueryParams(
          'http://example.com?c=d',
          { a: 'b' }
        ),
        'http://example.com?c=d&a=b'
      );
    });
  });
});
