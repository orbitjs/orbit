import { QueryNotAllowed } from '@orbit/data';
import {
  RecordKeyMap,
  InitializedRecord,
  RecordIdentity,
  RecordSchema,
  RecordNotFoundException,
  RecordOperation
} from '@orbit/records';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import {
  JSONAPIResourceIdentitySerializer,
  JSONAPIResourceSerializer
} from '../src';
import { NetworkError } from '../src/lib/exceptions';
import { JSONAPISource } from '../src/jsonapi-source';
import { Resource, ResourceDocument } from '../src/resource-document';
import { JSONAPISerializers } from '../src/serializers/jsonapi-serializers';
import { jsonapiResponse } from './support/jsonapi';
import {
  createSchemaWithoutKeys,
  createSchemaWithRemoteKey
} from './support/setup';

const { module, test } = QUnit;

module('JSONAPISource - queryable', function (hooks) {
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

    test('#query - record', async function (assert) {
      assert.expect(4);

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

      let record = await source.query((q) =>
        q.findRecord({ type: 'planet', id: planet.id })
      );

      assert.ok(
        !Array.isArray(record),
        'only a single primary record returned'
      );
      assert.equal((record as InitializedRecord).attributes?.name, 'Jupiter');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - record - fullResponse', async function (assert) {
      assert.expect(6);

      const resource: Resource = {
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
        .returns(jsonapiResponse(200, { data: resource }));

      let { data, details, transforms } = await source.query(
        (q) => q.findRecord({ type: 'planet', id: planet.id }),
        { fullResponse: true }
      );

      assert.ok(!Array.isArray(data), 'only a single primary record returned');
      assert.equal((data as InitializedRecord).attributes?.name, 'Jupiter');

      assert.equal(details?.[0].response.status, 200);

      assert.equal(transforms?.length, 1);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - record (304 response)', async function (assert) {
      assert.expect(3);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(304));

      let record = await source.query((q) =>
        q.findRecord({ type: 'planet', id: planet.id })
      );

      assert.strictEqual(record, undefined);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - can query with multiple expressions', async function (assert) {
      assert.expect(6);

      const data1: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter' }
      };

      const planet1 = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      const data2: Resource = {
        type: 'planet',
        id: '1234',
        attributes: { name: 'Earth' }
      };

      const planet2 = resourceSerializer.deserialize({
        type: 'planet',
        id: '1234'
      }) as InitializedRecord;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data: data1 }));
      fetchStub
        .withArgs('/planets/1234')
        .returns(jsonapiResponse(200, { data: data2 }));

      let records = (await source.query((q) => [
        q.findRecord({ type: 'planet', id: planet1.id }),
        q.findRecord({ type: 'planet', id: planet2.id })
      ])) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'multiple primary records returned');
      assert.equal(records[0].attributes?.name, 'Jupiter');
      assert.equal(records[1].attributes?.name, 'Earth');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
      assert.equal(
        fetchStub.getCall(1).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - can query with multiple expressions - fullResponse', async function (assert) {
      assert.expect(9);

      const data1: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter' }
      };

      const planet1 = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      const data2: Resource = {
        type: 'planet',
        id: '1234',
        attributes: { name: 'Earth' }
      };

      const planet2 = resourceSerializer.deserialize({
        type: 'planet',
        id: '1234'
      }) as InitializedRecord;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data: data1 }));
      fetchStub
        .withArgs('/planets/1234')
        .returns(jsonapiResponse(200, { data: data2 }));

      let { data, details, transforms } = await source.query(
        (q) => [
          q.findRecord({ type: 'planet', id: planet1.id }),
          q.findRecord({ type: 'planet', id: planet2.id })
        ],
        { fullResponse: true }
      );
      let records = data as InitializedRecord[];

      assert.ok(Array.isArray(records), 'multiple primary records returned');
      assert.equal(records[0].attributes?.name, 'Jupiter');
      assert.equal(records[1].attributes?.name, 'Earth');

      assert.equal(details?.[0].response.status, 200);
      assert.equal(details?.[1].response.status, 200);

      assert.equal(transforms?.length, 2);

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
      assert.equal(
        fetchStub.getCall(1).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - invokes preprocessResponseDocument when response has content', async function (assert) {
      assert.expect(1);

      const data: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };
      const meta = {
        'important-info': 'goes-here'
      };
      let responseDoc = { data, meta };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, responseDoc));

      const preprocessResponseDocumentSpy = sinon.spy(
        source.requestProcessor,
        'preprocessResponseDocument'
      );

      await source.query((q) =>
        q.findRecord({ type: 'planet', id: planet.id })
      );

      assert.ok(
        preprocessResponseDocumentSpy.calledOnceWith(
          responseDoc,
          sinon.match.any
        )
      );
      preprocessResponseDocumentSpy.restore();
    });

    test('#query - source can limit the number of allowed requests per query with `maxRequests` option', async function (assert) {
      assert.expect(1);

      const data1: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter' }
      };

      const planet1 = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      const data2: Resource = {
        type: 'planet',
        id: '1234',
        attributes: { name: 'Earth' }
      };

      const planet2 = resourceSerializer.deserialize({
        type: 'planet',
        id: '1234'
      }) as InitializedRecord;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data: data1 }));
      fetchStub
        .withArgs('/planets/1234')
        .returns(jsonapiResponse(200, { data: data2 }));

      source.defaultQueryOptions = {
        maxRequests: 1
      };

      try {
        await source.query((q) => [
          q.findRecord({ type: 'planet', id: planet1.id }),
          q.findRecord({ type: 'planet', id: planet2.id })
        ]);
      } catch (e) {
        assert.ok(e instanceof QueryNotAllowed, 'QueryNotAllowed thrown');
      }
    });

    test('#query - request can timeout', async function (assert) {
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
        await source.query((q) =>
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

    test('#query - allowed timeout can be specified per-request', async function (assert) {
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
        await source.query(
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

    test('#query - fetch can reject with a NetworkError', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub.withArgs('/planets/12345').returns(Promise.reject(':('));

      try {
        await source.query((q) =>
          q.findRecord({ type: 'planet', id: planet.id })
        );
        assert.ok(false, 'should not be reached');
      } catch (e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal((e as NetworkError).message, 'Network error: :(');
      }
    });

    test('#query - record with include', async function (assert) {
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

      await source.query(
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

    test('#query - options can be passed in at the root level or source-specific level', async function (assert) {
      assert.expect(1);

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

      fetchStub
        .withArgs('/planets/12345?include=moons')
        .returns(jsonapiResponse(200, { data }));

      await source.query(
        (q) => q.findRecord({ type: 'planet', id: planet.id }),
        {
          label: 'Fetch planet with moons',
          include: ['moons']
        }
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#query - records', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('planet')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Jupiter', 'Earth', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records (304 response)', async function (assert) {
      assert.expect(3);

      fetchStub.withArgs('/planets').returns(jsonapiResponse(304));

      let records = await source.query((q) => q.findRecords('planet'));

      assert.strictEqual(records, undefined);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - record (404 response) - returns undefined by default', async function (assert) {
      assert.expect(3);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(404));

      let record = await source.query((q) =>
        q.findRecord({ type: 'planet', id: planet.id })
      );

      assert.strictEqual(record, undefined);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test("#query - record (404 response) - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
      assert.expect(1);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      });

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(404));

      try {
        await source.query(
          (q) => q.findRecord({ type: 'planet', id: planet.id }),
          { raiseNotFoundExceptions: true }
        );
      } catch (e) {
        assert.ok(e instanceof RecordNotFoundException);
      }
    });

    test('#query - records with attribute filter', async function (assert) {
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

      let records = (await source.query((q) =>
        q.findRecords('planet').filter({ attribute: 'lengthOfDay', value: 24 })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with multiple attribute filters', async function (assert) {
      assert.expect(4);

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

      const records = await source.query<InitializedRecord[]>((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'lengthOfDay', value: 'le:24' },
            { attribute: 'lengthOfDay', value: 'ge:24' }
          )
      );

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with filters specified as an option', async function (assert) {
      assert.expect(4);

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

      const records = await source.query<InitializedRecord[]>((q) =>
        q.findRecords('planet').options({
          filter: { lengthOfDay: ['le:24', 'ge:24'] }
        })
      );

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with relatedRecord filter (single value)', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('moon').filter({
          relation: 'planet',
          record: { id: 'earth', type: 'planet' }
        })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Moon']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with relatedRecord filter (multiple values)', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('moon').filter({
          relation: 'planet',
          record: [
            { id: 'earth', type: 'planet' },
            { id: 'mars', type: 'planet' }
          ]
        })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Moon', 'Phobos', 'Deimos']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with relatedRecords filter', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('planet').filter({
          relation: 'moons',
          records: [
            { id: 'phobos', type: 'moon' },
            { id: 'deimos', type: 'moon' }
          ],
          op: 'equal'
        })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Mars']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with sort by an attribute in ascending order', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('planet').sort('name')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Earth', 'Jupiter', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with sort by an attribute in descending order', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('planet').sort('-name')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Saturn', 'Jupiter', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with sort by multiple fields', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('planet').sort('lengthOfDay', 'name')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Jupiter', 'Saturn', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with pagination', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRecords('planet').page({ offset: 1, limit: 10 })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Jupiter', 'Earth', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with attribute filter', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q
          .findRelatedRecords(solarSystem, 'planets')
          .filter({ attribute: 'lengthOfDay', value: 24 })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with relatedRecord filter (single value)', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRelatedRecords(solarSystem, 'moons').filter({
          relation: 'planet',
          record: { id: 'earth', type: 'planet' }
        })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Moon']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with relatedRecord filter (multiple values)', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRelatedRecords(solarSystem, 'moons').filter({
          relation: 'planet',
          record: [
            { id: 'earth', type: 'planet' },
            { id: 'mars', type: 'planet' }
          ]
        })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Moon', 'Phobos', 'Deimos']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with relatedRecords filter', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRelatedRecords(solarSystem, 'planets').filter({
          relation: 'moons',
          records: [
            { id: 'phobos', type: 'moon' },
            { id: 'deimos', type: 'moon' }
          ],
          op: 'equal'
        })
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Mars']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with sort by an attribute in ascending order', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRelatedRecords(solarSystem, 'planets').sort('name')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Earth', 'Jupiter', 'Saturn']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with sort by an attribute in descending order', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRelatedRecords(solarSystem, 'planets').sort('-name')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Saturn', 'Jupiter', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with sort by multiple fields', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRelatedRecords(solarSystem, 'planets').sort('lengthOfDay', 'name')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Jupiter', 'Saturn', 'Earth']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records with pagination', async function (assert) {
      assert.expect(8);

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

      let { data: records, transforms } = await source.query<
        InitializedRecord[]
      >(
        (q) =>
          q
            .findRelatedRecords(solarSystem, 'planets')
            .page({ offset: 1, limit: 10 }),
        { fullResponse: true }
      );

      assert.ok(Array.isArray(records), 'returned an array of data');
      if (records) {
        assert.equal(records.length, 3, 'three objects in data returned');
        assert.deepEqual(
          records.map((o) => o.attributes?.name),
          ['Jupiter', 'Earth', 'Saturn']
        );
      }

      assert.ok(Array.isArray(transforms), 'returned an array of transforms');
      if (transforms) {
        assert.equal(transforms.length, 1, 'one transform returned');

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
      }

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records without pagination, but explicit `partialSet: true` option', async function (assert) {
      assert.expect(8);

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

      fetchStub.withArgs(`/solar-systems/sun/planets`).returns(
        jsonapiResponse(200, {
          data,
          links: {}
        })
      );

      let { data: records, transforms } = await source.query<
        InitializedRecord[]
      >((q) => q.findRelatedRecords(solarSystem, 'planets'), {
        fullResponse: true,
        partialSet: true
      });

      assert.ok(Array.isArray(records), 'returned an array of data');
      if (records) {
        assert.equal(records.length, 3, 'three objects in data returned');
        assert.deepEqual(
          records.map((o) => o.attributes?.name),
          ['Jupiter', 'Earth', 'Saturn']
        );
      }

      assert.ok(Array.isArray(transforms), 'returned an array of transforms');
      if (transforms) {
        assert.equal(transforms.length, 1, 'one transform returned');

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
          ],
          'add to, but do not replace, related records'
        );
      }

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records without pagination, but explicit `partialSet: false` option', async function (assert) {
      assert.expect(8);

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

      fetchStub.withArgs(`/solar-systems/sun/planets`).returns(
        jsonapiResponse(200, {
          data,
          links: {}
        })
      );

      let { data: records, transforms } = await source.query<
        InitializedRecord[]
      >((q) => q.findRelatedRecords(solarSystem, 'planets'), {
        fullResponse: true,
        partialSet: false
      });

      assert.ok(Array.isArray(records), 'returned an array of data');
      if (records) {
        assert.equal(records.length, 3, 'three objects in data returned');
        assert.deepEqual(
          records.map((o) => o.attributes?.name),
          ['Jupiter', 'Earth', 'Saturn']
        );
      }

      assert.ok(Array.isArray(transforms), 'returned an array of transforms');
      if (transforms) {
        assert.equal(transforms.length, 1, 'one transform returned');

        const ops = transforms[0].operations as RecordOperation[];
        assert.deepEqual(
          ops.map((o) => o.op),
          [
            'updateRecord',
            'updateRecord',
            'updateRecord',
            'replaceRelatedRecords'
          ],
          'replacement of related records'
        );
      }

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related record (304 response)', async function (assert) {
      assert.expect(3);

      fetchStub
        .withArgs('/planets/earth/solar-system')
        .returns(jsonapiResponse(304));

      const earth = resourceSerializer.deserialize({
        type: 'planet',
        id: 'earth'
      }) as InitializedRecord;

      let records = await source.query((q) =>
        q.findRelatedRecord({ type: 'planet', id: earth.id }, 'solarSystem')
      );

      assert.strictEqual(records, undefined);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related record (404 response) - returns undefined by default', async function (assert) {
      assert.expect(3);

      fetchStub
        .withArgs('/planets/earth/solar-system')
        .returns(jsonapiResponse(404));

      const earth = resourceSerializer.deserialize({
        type: 'planet',
        id: 'earth'
      }) as InitializedRecord;

      let records = await source.query((q) =>
        q.findRelatedRecord({ type: 'planet', id: earth.id }, 'solarSystem')
      );

      assert.strictEqual(records, undefined);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test("#query - related record (404 response) - throws RecordNotFoundException if primary record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
      assert.expect(1);

      const earth = resourceSerializer.deserialize({
        type: 'planet',
        id: 'earth'
      }) as InitializedRecord;

      fetchStub
        .withArgs('/planets/earth/solar-system')
        .returns(jsonapiResponse(404));

      try {
        await source.query(
          (q) =>
            q.findRelatedRecord(
              { type: 'planet', id: earth.id },
              'solarSystem'
            ),
          { raiseNotFoundExceptions: true }
        );
      } catch (e) {
        assert.ok(e instanceof RecordNotFoundException);
      }
    });

    test('#query - related records (304 response)', async function (assert) {
      assert.expect(3);

      fetchStub
        .withArgs('/solar-systems/sun/planets')
        .returns(jsonapiResponse(304));

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      let records = await source.query((q) =>
        q.findRelatedRecords(
          { type: 'solarSystem', id: solarSystem.id },
          'planets'
        )
      );

      assert.strictEqual(records, undefined);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - related records (404 response) - returns undefined by default', async function (assert) {
      assert.expect(3);

      fetchStub
        .withArgs('/solar-systems/sun/planets')
        .returns(jsonapiResponse(404));

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      let records = await source.query((q) =>
        q.findRelatedRecords(
          { type: 'solarSystem', id: solarSystem.id },
          'planets'
        )
      );

      assert.strictEqual(records, undefined);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test("#query - related records (404 response) - throws RecordNotFoundException if primary record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
      assert.expect(1);

      fetchStub
        .withArgs('/solar-systems/sun/planets')
        .returns(jsonapiResponse(404));

      const solarSystem = resourceSerializer.deserialize({
        type: 'solarSystem',
        id: 'sun'
      }) as InitializedRecord;

      try {
        await source.query(
          (q) =>
            q.findRelatedRecords(
              { type: 'solarSystem', id: solarSystem.id },
              'planets'
            ),
          { raiseNotFoundExceptions: true }
        );
      } catch (e) {
        assert.ok(e instanceof RecordNotFoundException);
      }
    });

    test('#query - records with include', async function (assert) {
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

      await source.query((q) => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with include: verify only primary data array is returned', async function (assert) {
      assert.expect(6);

      const options = {
        sources: {
          jsonapi: {
            include: ['moons']
          }
        }
      };

      fetchStub.withArgs('/planets?include=moons').returns(
        jsonapiResponse(200, {
          data: [
            { type: 'planet', id: '1' },
            { type: 'planet', id: '2' }
          ],
          included: [
            { type: 'moon', id: '1' },
            { type: 'moon', id: '2' }
          ]
        })
      );

      let records = (await source.query(
        (q) => q.findRecords('planet'),
        options
      )) as InitializedRecord[];

      assert.ok(
        Array.isArray(records),
        'query result is an array, like primary data'
      );
      assert.equal(
        records.length,
        2,
        'query result length equals primary data length'
      );
      assert.deepEqual(
        records.map((planet) => planet.type),
        ['planet', 'planet']
      );
      assert.deepEqual(
        records.map((planet) => planet.keys?.remoteId),
        ['1', '2'],
        'returned IDs match primary data (including sorting)'
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records with include many relationships', async function (assert) {
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

      await source.query((q) => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - records invokes preprocessResponseDocument when response has content', async function (assert) {
      assert.expect(1);
      const responseDoc: ResourceDocument = {
        meta: { interesting: 'info' },
        data: []
      };
      fetchStub.withArgs(`/planets`).returns(jsonapiResponse(200, responseDoc));
      const preprocessResponseDocumentSpy = sinon.spy(
        source.requestProcessor,
        'preprocessResponseDocument'
      );

      await source.query((q) => q.findRecords('planet'), {});

      assert.ok(
        preprocessResponseDocumentSpy.calledOnceWith(
          responseDoc,
          sinon.match.any
        )
      );
      preprocessResponseDocumentSpy.restore();
    });

    test('#query - relatedRecords', async function (assert) {
      assert.expect(5);

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

      let records = (await source.query((q) =>
        q.findRelatedRecords(planet, 'moons')
      )) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(
        records.map((o) => o.attributes?.name),
        ['Io']
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - relatedRecords with include', async function (assert) {
      assert.expect(2);

      const resourceIdentitySerializer = source.requestProcessor.serializerFor(
        JSONAPISerializers.ResourceIdentity
      ) as JSONAPIResourceIdentitySerializer;

      const planet = resourceIdentitySerializer.deserialize({
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

      await source.query((q) => q.findRelatedRecords(planet, 'moons'), options);

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

    test('#query - can query multiple expressions in parallel (by default)', async function (assert) {
      assert.expect(10);

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

      const REQUEST_DELAY = 10;

      fetchStub
        .withArgs('/planets')
        .callsFake(() => jsonapiResponse(200, planetsDoc, REQUEST_DELAY));
      fetchStub
        .withArgs('/moons')
        .callsFake(() => jsonapiResponse(200, moonsDoc, REQUEST_DELAY));

      const startTime = new Date().getTime();

      let [planets, moons] = await source.query<InitializedRecord[][]>((q) => [
        q.findRecords('planet'),
        q.findRecords('moon')
      ]);

      const endTime = new Date().getTime();
      const elapsedTime = endTime - startTime;

      assert.ok(
        elapsedTime < 2 * REQUEST_DELAY,
        'query performed in parallel requests'
      );

      assert.equal(planets.length, 2, 'multiple planets returned');
      assert.equal(planets[0].attributes?.name, 'Jupiter');
      assert.equal(planets[1].attributes?.name, 'Earth');

      assert.equal(moons.length, 2, 'multiple moons returned');
      assert.equal(moons[0].attributes?.name, 'Io');
      assert.equal(moons[1].attributes?.name, 'Europa');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
      assert.equal(
        fetchStub.getCall(1).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - can query multiple expressions in series (via `parallelRequests: false` option)', async function (assert) {
      assert.expect(10);

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

      const REQUEST_DELAY = 10;

      fetchStub
        .withArgs('/planets')
        .callsFake(() => jsonapiResponse(200, planetsDoc, REQUEST_DELAY));

      fetchStub
        .withArgs('/moons')
        .callsFake(() => jsonapiResponse(200, moonsDoc, REQUEST_DELAY));

      const startTime = new Date().getTime();

      let [planets, moons] = (await source.query(
        (q) => [q.findRecords('planet'), q.findRecords('moon')],
        { parallelRequests: false }
      )) as InitializedRecord[][];

      const endTime = new Date().getTime();
      const elapsedTime = endTime - startTime;

      assert.ok(
        elapsedTime >= 2 * REQUEST_DELAY,
        'query requests performed in series'
      );

      assert.equal(planets.length, 2, 'multiple planets returned');
      assert.equal(planets[0].attributes?.name, 'Jupiter');
      assert.equal(planets[1].attributes?.name, 'Earth');

      assert.equal(moons.length, 2, 'multiple moons returned');
      assert.equal(moons[0].attributes?.name, 'Io');
      assert.equal(moons[1].attributes?.name, 'Europa');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
      assert.equal(
        fetchStub.getCall(1).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });

    test('#query - findRecord - url option can be passed', async function (assert) {
      assert.expect(1);

      const planetResource = {
        id: '12345',
        type: 'planet',
        attributes: { name: 'Jupiter' }
      };

      const planet = resourceSerializer.deserialize(
        planetResource
      ) as InitializedRecord;

      fetchStub.withArgs('/custom/path/here').returns(
        jsonapiResponse(200, {
          data: planetResource
        })
      );

      await source.query((q) => q.findRecord(planet), {
        url: '/custom/path/here'
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#query - findRecords - url option can be passed', async function (assert) {
      assert.expect(1);

      const planetResource = {
        id: '12345',
        type: 'planet',
        attributes: { name: 'Jupiter' }
      };

      fetchStub.withArgs('/custom/path/here').returns(
        jsonapiResponse(200, {
          data: [planetResource]
        })
      );

      await source.query((q) => q.findRecords('planet'), {
        url: '/custom/path/here'
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#query - findRelatedRecord - url option can be passed', async function (assert) {
      assert.expect(1);

      const planet = {
        id: '12345',
        type: 'planet'
      };

      fetchStub.withArgs('/custom/path/here').returns(
        jsonapiResponse(200, {
          data: null
        })
      );

      await source.query((q) => q.findRelatedRecord(planet, 'solarSystem'), {
        url: '/custom/path/here'
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#query - findRelatedRecords - url option can be passed', async function (assert) {
      assert.expect(1);

      const planet = {
        id: '12345',
        type: 'planet'
      };

      fetchStub.withArgs('/custom/path/here').returns(
        jsonapiResponse(200, {
          data: []
        })
      );

      await source.query((q) => q.findRelatedRecords(planet, 'moons'), {
        url: '/custom/path/here'
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#query - will return an array of results for a query that contains an array with a single expression', async function (assert) {
      assert.expect(4);

      const data1: Resource = {
        type: 'planet',
        id: '12345',
        attributes: { name: 'Jupiter' }
      };

      const planet1 = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data: data1 }));

      let records = (await source.query((q) => [
        q.findRecord({ type: 'planet', id: planet1.id })
      ])) as InitializedRecord[];

      assert.ok(Array.isArray(records), 'multiple primary records returned');
      assert.equal(records[0].attributes?.name, 'Jupiter');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        undefined,
        'fetch called with no method (equivalent to GET)'
      );
    });
  });
});
