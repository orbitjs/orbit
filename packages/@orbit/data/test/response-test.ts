import { mapNamedFullResponses } from '../src/response';
import { RecordData, RecordOperation } from './support/record-data';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('Response', function () {
  test('mapNamedFullResponses transforms an array of NamedFullResponse objects into a NamedFullResponseMap', function (assert) {
    assert.deepEqual(
      mapNamedFullResponses<RecordData, unknown, RecordOperation>([
        [
          'remote1',
          { data: { type: 'planet', id: 'jupiter' }, transforms: [] }
        ],
        undefined, // will be ignored
        undefined, // will be ignored
        ['remote2', { data: { type: 'moon', id: 'io' }, transforms: [] }]
      ]),
      {
        remote1: {
          data: { type: 'planet', id: 'jupiter' },
          transforms: []
        },
        remote2: {
          data: { type: 'moon', id: 'io' },
          transforms: []
        }
      }
    );
  });
});
