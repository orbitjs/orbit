import { requestOptionsForSource } from '../src/request';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

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
          memoryMeta: 'abc'
        },
        remote: {
          label: 'remoteRequest',
          url: 'http://example.com'
        }
      }
    };

    assert.strictEqual(
      requestOptionsForSource(vanilla, 'memory'),
      vanilla,
      'identical options are returned if there are no source-specific options'
    );

    assert.deepEqual(
      requestOptionsForSource(custom, 'backup'),
      {
        label: 'request',
        counter: 10
      },
      'source-less options are returned if there are no options specific to the source'
    );

    assert.deepEqual(
      requestOptionsForSource(custom, 'memory'),
      {
        label: 'memoryRequest',
        memoryMeta: 'abc',
        counter: 10
      },
      'options are merged with source-specific options'
    );
  });
});
