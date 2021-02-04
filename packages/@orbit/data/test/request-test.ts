import { RequestOptions, requestOptionsForSource } from '../src/request';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

interface ExampleRequestOptions extends RequestOptions {
  label?: string;
  counter?: number;
  meta?: string;
}

module('Request', function () {
  test('requestOptionsForSource merges any source-specific options with top-level options', function (assert) {
    let vanilla = {
      label: 'request',
      counter: 10
    };

    let custom = {
      label: 'request',
      counter: 10,
      sources: {
        memory: {
          label: 'memoryRequest',
          meta: 'abc'
        },
        remote: {
          label: 'remoteRequest',
          url: 'http://example.com'
        }
      }
    };

    let custom2 = {
      label: 'expression',
      sources: {
        memory: {
          label: 'memoryExpression',
          meta: 'abc'
        },
        remote: {
          label: 'remoteExpression',
          url: 'http://example.com/1'
        }
      }
    };

    assert.strictEqual(
      requestOptionsForSource(vanilla, 'memory'),
      vanilla,
      'identical options are returned if there are no source-specific options'
    );

    assert.deepEqual(
      requestOptionsForSource<ExampleRequestOptions>(custom, 'backup'),
      {
        label: 'request',
        counter: 10
      },
      'source-less options are returned if there are no options specific to the source'
    );

    assert.deepEqual(
      requestOptionsForSource<ExampleRequestOptions>(custom, 'memory'),
      {
        label: 'memoryRequest',
        meta: 'abc',
        counter: 10
      },
      'options are merged with source-specific options'
    );

    assert.deepEqual(
      requestOptionsForSource<ExampleRequestOptions>(custom),
      {
        label: 'request',
        counter: 10
      },
      'if no source name is specified, return source-less options'
    );

    assert.deepEqual(
      requestOptionsForSource<ExampleRequestOptions>(
        [custom, custom2],
        'memory'
      ),
      {
        label: 'memoryExpression',
        counter: 10,
        meta: 'abc'
      },
      'multiple options are merged, with source-specific options taking precedence'
    );

    assert.deepEqual(
      requestOptionsForSource<ExampleRequestOptions>([custom, custom2]),
      {
        label: 'expression',
        counter: 10
      },
      'multiple options are merged even when no source is provided'
    );

    assert.deepEqual(
      requestOptionsForSource<ExampleRequestOptions>(
        [custom, undefined, undefined, custom2],
        'memory'
      ),
      {
        label: 'memoryExpression',
        counter: 10,
        meta: 'abc'
      },
      'undefined options are ignored when merging'
    );

    assert.deepEqual(
      requestOptionsForSource<ExampleRequestOptions>(undefined, 'memory'),
      undefined,
      'undefined may be returned'
    );
  });
});
