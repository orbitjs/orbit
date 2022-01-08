import {
  RecordKeyMap,
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  RecordSchema,
  UpdateRecordOperation,
  RecordTransform
} from '@orbit/records';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { toArray } from '@orbit/utils';
import {
  JSONAPIResourceIdentitySerializer,
  JSONAPIResourceSerializer,
  Resource
} from '../src';
import { NetworkError } from '../src/lib/exceptions';
import { JSONAPISource } from '../src/jsonapi-source';
import { JSONAPISerializers } from '../src/serializers/jsonapi-serializers';
import { jsonapiResponse } from './support/jsonapi';
import {
  createSchemaWithoutKeys,
  createSchemaWithRemoteKey
} from './support/setup';

const { module, test } = QUnit;

module('JSONAPISource - pullable', function (hooks) {
  let fetchStub: SinonStub;
  let keyMap: RecordKeyMap;
  let schema: RecordSchema;
  let source: JSONAPISource;
  let resourceSerializer: JSONAPIResourceSerializer;

  hooks.beforeEach(() => {
    fetchStub = sinon.stub(self, 'fetch');
  });

  hooks.afterEach(() => {
    fetchStub.restore();
  });

  module('with a secondary key', function (hooks) {
    hooks.beforeEach(() => {
      schema = createSchemaWithRemoteKey();
      keyMap = new RecordKeyMap();
      source = new JSONAPISource({
        schema,
        keyMap
      });
      resourceSerializer = source.requestProcessor.serializerFor(
        JSONAPISerializers.Resource
      ) as JSONAPIResourceSerializer;
    });

    test('#pull - record', async function (assert) {
      assert.expect(6);

      const data: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecord({ type: 'planet', id: planet.id })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Jupiter']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - record (with a 304 response)', async function (assert) {
      assert.expect(3);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(304));

      let transforms = (await source.pull((q) =>
        q.findRecord({ type: 'planet', id: planet.id })
      )) as RecordTransform[];

      assert.equal(transforms.length, 0, 'no transforms returned');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - request can timeout', async function (assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      // 10ms timeout
      source.requestProcessor.defaultFetchSettings.timeout = 10;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data }, 20)); // 20ms delay

      try {
        await source.pull((q) =>
          q.findRecord({ type: 'planet', id: planet.id })
        );
        assert.ok(false, 'should not be reached');
      } catch (e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(
          (e as NetworkError).message,
          'Network error: No fetch response within 10ms.'
        );
      }
    });

    test('#pull - allowed timeout can be specified per-request', async function (assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      const options = {
        sources: {
          jsonapi: {
            settings: {
              timeout: 10 // 10ms timeout
            }
          }
        }
      };

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data }, 20)); // 20ms delay

      try {
        await source.pull(
          (q) => q.findRecord({ type: 'planet', id: planet.id }),
          options
        );
        assert.ok(false, 'should not be reached');
      } catch (e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(
          (e as NetworkError).message,
          'Network error: No fetch response within 10ms.'
        );
      }
    });

    test('#pull - fetch can reject with a NetworkError', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub.withArgs('/planets/12345').returns(Promise.reject(':('));

      try {
        await source.pull((q) =>
          q.findRecord({ type: 'planet', id: planet.id })
        );
        assert.ok(false, 'should not be reached');
      } catch (e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal((e as NetworkError).message, 'Network error: :(');
      }
    });

    test('#pull - record with include', async function (assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      const options = {
        sources: {
          jsonapi: {
            include: ['moons']
          }
        }
      };

      fetchStub
        .withArgs('/planets/12345?include=moons')
        .returns(jsonapiResponse(200, { data }));

      await source.pull(
        (q) => q.findRecord({ type: 'planet', id: planet.id }),
        options
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planet',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        }
      ];

      fetchStub.withArgs('/planets').returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Jupiter', 'Earth', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records (with a 304 response)', async function (assert) {
      assert.expect(3);

      fetchStub.withArgs('/planets').returns(jsonapiResponse(304));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet')
      )) as RecordTransform[];

      assert.equal(transforms.length, 0, 'no transforms returned');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with attribute filter', async function (assert) {
      assert.expect(5);

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('filter[lengthOfDay]')}=24`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet').filter({ attribute: 'lengthOfDay', value: 24 })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with attribute filters', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          }
        }
      ];

      const value1 = encodeURIComponent('le:24');
      const value2 = encodeURIComponent('ge:24');
      const attribute = encodeURIComponent('filter[lengthOfDay]');
      const expectedUrl = `/planets?${attribute}=${value1}&${attribute}=${value2}`;

      fetchStub.withArgs(expectedUrl).returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'lengthOfDay', value: 'le:24' },
            { attribute: 'lengthOfDay', value: 'ge:24' }
          )
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with relatedRecord filter (single value)', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moon',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planet' } }
          }
        }
      ];

      fetchStub
        .withArgs(`/moons?${encodeURIComponent('filter[planet]')}=earth`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('moon').filter({
          relation: 'planet',
          record: { id: 'earth', type: 'planet' }
        })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Moon']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with relatedRecord filter (multiple values)', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moon',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planet' } }
          }
        },
        {
          id: 'phobos',
          type: 'moon',
          attributes: { name: 'Phobos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planet' } }
          }
        },
        {
          id: 'deimos',
          type: 'moon',
          attributes: { name: 'Deimos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planet' } }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/moons?${encodeURIComponent('filter[planet]')}=${encodeURIComponent(
            'earth,mars'
          )}`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('moon').filter({
          relation: 'planet',
          record: [
            { id: 'earth', type: 'planet' },
            { id: 'mars', type: 'planet' }
          ]
        })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Moon', 'Phobos', 'Deimos']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with relatedRecords filter', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          id: 'mars',
          type: 'planet',
          attributes: { name: 'Mars' },
          relationships: {
            moons: {
              data: [
                { id: 'phobos', type: 'moon' },
                { id: 'deimos', type: 'moon' }
              ]
            }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/planets?${encodeURIComponent('filter[moons]')}=${encodeURIComponent(
            'phobos,deimos'
          )}`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet').filter({
          relation: 'moons',
          records: [
            { id: 'phobos', type: 'moon' },
            { id: 'deimos', type: 'moon' }
          ],
          op: 'equal'
        })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Mars']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with sort by an attribute in ascending order', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planet',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        }
      ];

      fetchStub
        .withArgs('/planets?sort=name')
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet').sort('name')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Earth', 'Jupiter', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with sort by an attribute in descending order', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        }
      ];

      fetchStub
        .withArgs('/planets?sort=-name')
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet').sort('-name')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Saturn', 'Jupiter', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with sort by multiple fields', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant',
            lengthOfDay: 9.9
          }
        },
        {
          type: 'planet',
          attributes: {
            name: 'Saturn',
            classification: 'gas giant',
            lengthOfDay: 10.7
          }
        },
        {
          type: 'planet',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24.0
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?sort=${encodeURIComponent('lengthOfDay,name')}`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet').sort('lengthOfDay', 'name')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Jupiter', 'Saturn', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with pagination', async function (assert) {
      assert.expect(6);

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planet',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        }
      ];

      fetchStub
        .withArgs(
          `/planets?${encodeURIComponent(
            'page[offset]'
          )}=1&${encodeURIComponent('page[limit]')}=10`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRecords('planet').page({ offset: 1, limit: 10 })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Jupiter', 'Earth', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - related records with attribute filter', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          },
          relationships: {
            solarSystem: {
              data: {
                type: 'solarSystem',
                id: 'sun'
              }
            }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/planets?${encodeURIComponent(
            'filter[lengthOfDay]'
          )}=24`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q
          .findRelatedRecords(solarSystem, 'planets')
          .filter({ attribute: 'lengthOfDay', value: 24 })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        ['updateRecord', 'addToRelatedRecords']
      );

      let op1 = ops[0] as UpdateRecordOperation;

      assert.equal(op1.record.attributes?.name, 'Earth');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - related records with attribute filters', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          }
        }
      ];

      const value1 = encodeURIComponent('le:24');
      const value2 = encodeURIComponent('ge:24');
      const attribute = encodeURIComponent('filter[lengthOfDay]');
      const expectedUrl = `/solar-systems/sun/planets?${attribute}=${value1}&${attribute}=${value2}`;

      fetchStub.withArgs(expectedUrl).returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q
          .findRelatedRecords(solarSystem, 'planets')
          .filter(
            { attribute: 'lengthOfDay', value: 'le:24' },
            { attribute: 'lengthOfDay', value: 'ge:24' }
          )
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        ['updateRecord', 'addToRelatedRecords']
      );

      let op1 = ops[0] as UpdateRecordOperation;

      assert.equal(op1.record.attributes?.name, 'Earth');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with relatedRecord filter (single value)', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moon',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planet' } }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/moons?${encodeURIComponent(
            'filter[planet]'
          )}=earth`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecords(solarSystem, 'moons').filter({
          relation: 'planet',
          record: { id: 'earth', type: 'planet' }
        })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        ['updateRecord', 'addToRelatedRecords']
      );

      let op1 = ops[0] as UpdateRecordOperation;

      assert.equal(op1.record.attributes?.name, 'Moon');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with relatedRecord filter (multiple values)', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moon',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planet' } }
          }
        },
        {
          id: 'phobos',
          type: 'moon',
          attributes: { name: 'Phobos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planet' } }
          }
        },
        {
          id: 'deimos',
          type: 'moon',
          attributes: { name: 'Deimos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planet' } }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/moons?${encodeURIComponent(
            'filter[planet]'
          )}=${encodeURIComponent('earth,mars')}`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecords(solarSystem, 'moons').filter({
          relation: 'planet',
          record: [
            { id: 'earth', type: 'planet' },
            { id: 'mars', type: 'planet' }
          ]
        })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        [
          'updateRecord',
          'updateRecord',
          'updateRecord',
          'addToRelatedRecords',
          'addToRelatedRecords',
          'addToRelatedRecords'
        ]
      );

      let op1 = ops[0] as UpdateRecordOperation;
      let op2 = ops[1] as UpdateRecordOperation;
      let op3 = ops[2] as UpdateRecordOperation;

      assert.deepEqual(
        [op1, op2, op3].map((o) => o.record.attributes?.name),
        ['Moon', 'Phobos', 'Deimos']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with relatedRecords filter', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          id: 'mars',
          type: 'planet',
          attributes: { name: 'Mars' },
          relationships: {
            moons: {
              data: [
                { id: 'phobos', type: 'moon' },
                { id: 'deimos', type: 'moon' }
              ]
            }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/planets?${encodeURIComponent(
            'filter[moons]'
          )}=${encodeURIComponent('phobos,deimos')}`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecords(solarSystem, 'planets').filter({
          relation: 'moons',
          records: [
            { id: 'phobos', type: 'moon' },
            { id: 'deimos', type: 'moon' }
          ],
          op: 'equal'
        })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        ['updateRecord', 'addToRelatedRecords']
      );

      let op1 = ops[0] as UpdateRecordOperation;

      assert.equal(op1.record.attributes?.name, 'Mars');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with sort by an attribute in ascending order', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planet',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        }
      ];

      fetchStub
        .withArgs('/solar-systems/sun/planets?sort=name')
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecords(solarSystem, 'planets').sort('name')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        [
          'updateRecord',
          'updateRecord',
          'updateRecord',
          'replaceRelatedRecords'
        ]
      );

      let op1 = ops[0] as UpdateRecordOperation;
      let op2 = ops[1] as UpdateRecordOperation;
      let op3 = ops[2] as UpdateRecordOperation;

      assert.deepEqual(
        [op1, op2, op3].map((o) => o.record.attributes?.name),
        ['Earth', 'Jupiter', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with sort by an attribute in descending order', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        }
      ];

      fetchStub
        .withArgs('/solar-systems/sun/planets?sort=-name')
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecords(solarSystem, 'planets').sort('-name')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        [
          'updateRecord',
          'updateRecord',
          'updateRecord',
          'replaceRelatedRecords'
        ]
      );

      let op1 = ops[0] as UpdateRecordOperation;
      let op2 = ops[1] as UpdateRecordOperation;
      let op3 = ops[2] as UpdateRecordOperation;

      assert.deepEqual(
        [op1, op2, op3].map((o) => o.record.attributes?.name),
        ['Saturn', 'Jupiter', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with sort by multiple fields', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant',
            lengthOfDay: 9.9
          }
        },
        {
          type: 'planet',
          attributes: {
            name: 'Saturn',
            classification: 'gas giant',
            lengthOfDay: 10.7
          }
        },
        {
          type: 'planet',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24.0
          }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/planets?sort=${encodeURIComponent(
            'lengthOfDay,name'
          )}`
        )
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecords(solarSystem, 'planets').sort('lengthOfDay', 'name')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        [
          'updateRecord',
          'updateRecord',
          'updateRecord',
          'replaceRelatedRecords'
        ]
      );

      let op1 = ops[0] as UpdateRecordOperation;
      let op2 = ops[1] as UpdateRecordOperation;
      let op3 = ops[2] as UpdateRecordOperation;

      assert.deepEqual(
        [op1, op2, op3].map((o) => o.record.attributes?.name),
        ['Jupiter', 'Saturn', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with pagination', async function (assert) {
      assert.expect(6);

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      const data: Resource[] = [
        {
          type: 'planet',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planet',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planet',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/planets?${encodeURIComponent(
            'page[offset]'
          )}=1&${encodeURIComponent('page[limit]')}=10`
        )
        .returns(
          jsonapiResponse(200, {
            data,
            links: {
              next: `/solar-systems/sun/planets?${encodeURIComponent(
                'page[offset]'
              )}=2&${encodeURIComponent('page[limit]')}=10`
            }
          })
        );

      let transforms = (await source.pull((q) =>
        q
          .findRelatedRecords(solarSystem, 'planets')
          .page({ offset: 1, limit: 10 })
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        [
          'updateRecord',
          'updateRecord',
          'updateRecord',
          'addToRelatedRecords',
          'addToRelatedRecords',
          'addToRelatedRecords'
        ]
      );

      let op1 = ops[0] as UpdateRecordOperation;
      let op2 = ops[1] as UpdateRecordOperation;
      let op3 = ops[2] as UpdateRecordOperation;

      assert.deepEqual(
        [op1, op2, op3].map((o) => o.record.attributes?.name),
        ['Jupiter', 'Earth', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with include', async function (assert) {
      assert.expect(2);

      const options = {
        sources: {
          jsonapi: {
            include: ['moons']
          }
        }
      };

      fetchStub
        .withArgs('/planets?include=moons')
        .returns(jsonapiResponse(200, { data: [] }));

      await source.pull((q) => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - records with include many relationships', async function (assert) {
      assert.expect(2);

      const options = {
        sources: {
          jsonapi: {
            include: ['moons', 'solar-systems']
          }
        }
      };

      fetchStub
        .withArgs(
          `/planets?include=${encodeURIComponent('moons,solar-systems')}`
        )
        .returns(jsonapiResponse(200, { data: [] }));

      await source.pull((q) => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - relatedRecord', async function (assert) {
      assert.expect(13);

      const planetRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: 'jupiter'
      }) as InitializedRecord;

      const data: Resource = {
        type: 'solarSystem',
        id: 'ours',
        attributes: {
          name: 'Our Solar System'
        }
      };

      fetchStub
        .withArgs('/planets/jupiter/solar-system')
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecord(planetRecord, 'solarSystem')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );
      const operations = transforms[0].operations as RecordOperation[];

      const planetId = keyMap.keyToId('planet', 'remoteId', 'jupiter');
      const ssId = keyMap.keyToId('solarSystem', 'remoteId', 'ours');

      assert.deepEqual(
        operations.map((o) => o.op),
        ['updateRecord', 'replaceRelatedRecord']
      );

      const op1 = operations[0] as UpdateRecordOperation;
      assert.equal(op1.record.type, 'solarSystem');
      assert.equal(op1.record.id, ssId);
      assert.equal(op1.record.attributes?.name, 'Our Solar System');

      const op2 = operations[1] as ReplaceRelatedRecordOperation;
      assert.equal(op2.record.type, 'planet');
      assert.equal(op2.record.id, planetId);
      assert.equal(op2.relationship, 'solarSystem');
      assert.equal(op2.relatedRecord?.type, 'solarSystem');
      assert.equal(op2.relatedRecord?.id, ssId);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - relatedRecords', async function (assert) {
      assert.expect(9);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: 'jupiter'
      }) as InitializedRecord;

      let data = [
        {
          type: 'moon',
          id: 'io',
          attributes: {
            name: 'Io'
          }
        }
      ];

      fetchStub
        .withArgs('/planets/jupiter/moons')
        .returns(jsonapiResponse(200, { data }));

      let transforms = (await source.pull((q) =>
        q.findRelatedRecords(planet, 'moons')
      )) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.ok(
        source.transformLog.contains(transforms[0].id),
        'log contains transform'
      );

      const ops = transforms[0].operations as RecordOperation[];
      assert.deepEqual(
        ops.map((o) => o.op),
        ['updateRecord', 'replaceRelatedRecords']
      );

      const op1 = ops[0] as UpdateRecordOperation;
      assert.equal(op1.record.attributes?.name, 'Io');

      const op2 = ops[1] as ReplaceRelatedRecordsOperation;
      assert.equal(op2.record.id, planet.id);
      assert.equal(op2.relationship, 'moons');
      assert.deepEqual(
        op2.relatedRecords.map((r) => r.id),
        [op1.record.id]
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#pull - relatedRecords with include', async function (assert) {
      assert.expect(2);

      const resourceIdentitySerializer = source.requestProcessor.serializerFor(
        JSONAPISerializers.ResourceIdentity
      ) as JSONAPIResourceIdentitySerializer;

      const planetRecord = resourceIdentitySerializer.deserialize({
        type: 'planet',
        id: 'jupiter'
      }) as RecordIdentity;

      const options = {
        sources: {
          jsonapi: {
            include: ['planet']
          }
        }
      };

      fetchStub
        .withArgs('/planets/jupiter/moons?include=planet')
        .returns(jsonapiResponse(200, { data: [] }));

      await source.pull(
        (q) => q.findRelatedRecords(planetRecord, 'moons'),
        options
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });
  });

  module('with no secondary keys', function (hooks) {
    hooks.beforeEach(function () {
      let schema = createSchemaWithoutKeys();
      source = new JSONAPISource({ schema });
      resourceSerializer = source.requestProcessor.serializerFor(
        JSONAPISerializers.Resource
      ) as JSONAPIResourceSerializer;
    });

    test('#pull - one expression', async function (assert) {
      assert.expect(3);

      const planetsDoc = {
        data: [
          {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          },
          {
            type: 'planet',
            id: 'p2',
            attributes: { name: 'Earth' }
          }
        ]
      };

      fetchStub.withArgs('/planets').returns(jsonapiResponse(200, planetsDoc));

      let transforms = (await source.pull((q) => [
        q.findRecords('planet')
      ])) as RecordTransform[];

      assert.equal(transforms.length, 1, 'one transform returned');

      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Jupiter', 'Earth']
      );
    });

    test('#pull - can query multiple expressions in series', async function (assert) {
      assert.expect(5);

      const planetsDoc = {
        data: [
          {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          },
          {
            type: 'planet',
            id: 'p2',
            attributes: { name: 'Earth' }
          }
        ]
      };

      const moonsDoc = {
        data: [
          {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' }
          },
          {
            type: 'moon',
            id: 'm2',
            attributes: { name: 'Europa' }
          }
        ]
      };

      fetchStub.withArgs('/planets').returns(jsonapiResponse(200, planetsDoc));
      fetchStub.withArgs('/moons').returns(jsonapiResponse(200, moonsDoc));

      let transforms = (await source.pull((q) => [
        q.findRecords('planet'),
        q.findRecords('moon')
      ])) as RecordTransform[];

      assert.equal(transforms.length, 2, 'two transforms returned');

      assert.deepEqual(
        toArray(transforms[0].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[0].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Jupiter', 'Earth']
      );

      assert.deepEqual(
        toArray(transforms[1].operations).map((o) => o.op),
        ['updateRecord', 'updateRecord']
      );
      assert.deepEqual(
        toArray(transforms[1].operations).map(
          (o) => (o as UpdateRecordOperation).record.attributes?.name
        ),
        ['Io', 'Europa']
      );
    });
  });
});
