import { buildTransform, TransformNotAllowed } from '@orbit/data';
import {
  AddRecordOperation,
  InitializedRecord,
  RecordKeyMap,
  RecordOperation,
  RecordSchema,
  RecordTransform,
  ReplaceKeyOperation,
  UpdateRecordOperation
} from '@orbit/records';
import { toArray } from '@orbit/utils';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { JSONAPIResourceSerializer } from '../src';
import { JSONAPISource } from '../src/jsonapi-source';
import { ClientError, NetworkError } from '../src/lib/exceptions';
import { JSONAPISerializers } from '../src/serializers/jsonapi-serializers';
import { jsonapiResponse } from './support/jsonapi';
import {
  createSchemaWithoutKeys,
  createSchemaWithRemoteKey
} from './support/setup';

const { module, test } = QUnit;

module('JSONAPISource - pushable', function (hooks) {
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

    test('#push - can add records', async function (assert) {
      assert.expect(9);

      let transformCount = 0;

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      }) as InitializedRecord;

      const addPlanetOp: AddRecordOperation = {
        op: 'addRecord',
        record: {
          type: 'planet',
          id: planet.id,
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        }
      };

      const addPlanetRemoteIdOp: ReplaceKeyOperation = {
        op: 'replaceKey',
        record: { type: 'planet', id: planet.id },
        key: 'remoteId',
        value: '12345'
      };

      source.on('transform', function (transform: RecordTransform) {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            addPlanetOp,
            'transform event initially returns add-record op'
          );
        } else if (transformCount === 2) {
          // Remote ID is added as a separate operation
          assert.deepEqual(
            transform.operations,
            [addPlanetRemoteIdOp],
            'transform event then returns add-remote-id op'
          );
        }
      });

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: '12345',
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      const t = buildTransform({
        op: 'addRecord',
        record: planet
      } as AddRecordOperation);

      let result = (await source.push(t)) as RecordTransform[];

      assert.equal(result.length, 2, 'two transforms applied');
      assert.deepEqual(result[0], t, 'result represents transforms applied');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.ok(source.transformLog.contains(t.id), 'log contains transform');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'POST',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'planet',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - will not issue fetch if beforePush listener logs transform', async function (assert) {
      assert.expect(2);

      const planet = resourceSerializer.deserialize({
        type: 'planet',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      }) as InitializedRecord;

      const t = buildTransform({
        op: 'addRecord',
        record: planet
      } as AddRecordOperation);

      source.on('beforePush', async function (transform: RecordTransform) {
        await source.transformLog.append(t.id);
      });

      const result = await source.push(t);

      assert.deepEqual(result, [], 'result represents transforms applied');
      assert.ok(source.transformLog.contains(t.id), 'log contains transform');
    });

    test('#push - can add sideloaded records', async function (assert) {
      assert.expect(8);

      let transformCount = 0;

      const planet = resourceSerializer.deserialize({
        type: 'planet',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      }) as InitializedRecord;

      const addPlanetOp: AddRecordOperation = {
        op: 'addRecord',
        record: {
          type: 'planet',
          id: planet.id,
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        }
      };

      const addPlanetRemoteIdOp: ReplaceKeyOperation = {
        op: 'replaceKey',
        record: { type: 'planet', id: planet.id },
        key: 'remoteId',
        value: '12345'
      };

      const addMoonOp = {
        op: 'updateRecord',
        record: {
          type: 'moon',
          keys: {
            remoteId: '321'
          },
          attributes: {
            name: 'Europa'
          }
        }
      };

      source.on('transform', (transform: RecordTransform) => {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            addPlanetOp,
            'transform event initially returns add-record op'
          );
        } else if (transformCount === 2) {
          // Remote ID is added as a separate operation
          assert.deepEqual(
            transform.operations,
            [addPlanetRemoteIdOp],
            'transform event then returns add-remote-id op'
          );
        } else if (transformCount === 3) {
          let operationsWithoutId = toArray(transform.operations).map((op) => {
            let clonedOp = Object.assign({}, op) as RecordOperation;
            delete (clonedOp as any).record.id;
            return clonedOp;
          });
          assert.deepEqual(
            operationsWithoutId,
            [addMoonOp as any],
            'transform event to add included records'
          );
        }
      });

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: '12345',
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' },
            relationships: { moons: [{ id: '321', type: 'moon' }] }
          },
          included: [
            {
              id: '321',
              type: 'moon',
              attributes: {
                name: 'Europa'
              }
            }
          ]
        })
      );

      await source.push((t) => t.addRecord(planet));

      assert.ok(true, 'transform resolves successfully');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'POST',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'planet',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - options can be passed in at the root level or source-specific level', async function (assert) {
      assert.expect(1);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      }) as InitializedRecord;

      fetchStub.withArgs('/planets?include=moons').returns(
        jsonapiResponse(201, {
          data: {
            id: '12345',
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' },
            relationships: { moons: [{ id: '321', type: 'moon' }] }
          },
          included: [
            {
              id: '321',
              type: 'moon',
              attributes: {
                name: 'Europa'
              }
            }
          ]
        })
      );

      await source.push((t) => t.addRecord(planet), {
        include: ['moons']
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#push - can transform records', async function (assert) {
      assert.expect(6);

      let transformCount = 0;

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      const replacePlanetOp: UpdateRecordOperation = {
        op: 'updateRecord',
        record: {
          type: 'planet',
          id: planet.id,
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          keys: {
            remoteId: '12345'
          }
        }
      };

      source.on('transform', (transform: RecordTransform) => {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            replacePlanetOp,
            'transform event initially returns replace-record op'
          );
        }
      });

      fetchStub.withArgs('/planets/12345').returns(
        jsonapiResponse(200, {
          data: {
            id: '12345',
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      await source.push((t) => t.updateRecord(planet));

      assert.ok(true, 'transform resolves successfully');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'PATCH',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'planet',
            id: '12345',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - can replace a single attribute', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      }) as InitializedRecord;

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(204));

      await source.push((t) =>
        t.replaceAttribute(planet, 'classification', 'terrestrial')
      );

      assert.ok(true, 'record patched');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'PATCH',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'planet',
            id: '12345',
            attributes: {
              classification: 'terrestrial'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - can accept remote changes', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub.withArgs('/planets/12345').returns(
        jsonapiResponse(200, {
          data: {
            type: 'planet',
            id: 'remote-id-123',
            attributes: {
              name: 'Mars',
              classification: 'terrestrial'
            }
          }
        })
      );

      let transforms = (await source.push((t) =>
        t.replaceAttribute(planet, 'classification', 'terrestrial')
      )) as RecordTransform[];

      assert.deepEqual(
        toArray(transforms[1].operations).map((o) => o.op),
        ['replaceAttribute', 'replaceKey']
      );
      const ops = transforms[1].operations as ReplaceKeyOperation[];
      assert.deepEqual(
        ops.map((o) => o.value),
        ['Mars', 'remote-id-123']
      );
    });

    test('#push - can delete records', async function (assert) {
      assert.expect(4);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(200));

      await source.push((t) => t.removeRecord(planet));

      assert.ok(true, 'record deleted');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'DELETE',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].body,
        null,
        'fetch called with no data'
      );
    });

    test('#push - can add a hasMany relationship with POST', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      let moon = resourceSerializer.deserialize({
        type: 'moon',
        id: '987'
      }) as InitializedRecord;

      fetchStub
        .withArgs('/planets/12345/relationships/moons')
        .returns(jsonapiResponse(204));

      await source.push((t) => t.addToRelatedRecords(planet, 'moons', moon));

      assert.ok(true, 'records linked');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'POST',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        { data: [{ type: 'moon', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#push - can remove a relationship with DELETE', async function (assert) {
      assert.expect(4);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      let moon = resourceSerializer.deserialize({
        type: 'moon',
        id: '987'
      }) as InitializedRecord;

      fetchStub
        .withArgs('/planets/12345/relationships/moons')
        .returns(jsonapiResponse(200));

      await source.push((t) =>
        t.removeFromRelatedRecords(planet, 'moons', moon)
      );

      assert.ok(true, 'records unlinked');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'DELETE',
        'fetch called with expected method'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        { data: [{ type: 'moon', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#push - can update a hasOne relationship with PATCH', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      let moon = resourceSerializer.deserialize({
        type: 'moon',
        id: '987'
      }) as InitializedRecord;

      fetchStub.withArgs('/moons/987').returns(jsonapiResponse(200));

      await source.push((t) => t.replaceRelatedRecord(moon, 'planet', planet));

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'PATCH',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'moon',
            id: '987',
            relationships: {
              planet: { data: { type: 'planet', id: '12345' } }
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - can update a hasOne relationship with PATCH with newly created record', async function (assert) {
      assert.expect(5);

      let planet = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      } as InitializedRecord;

      let moon = resourceSerializer.deserialize({
        type: 'moon',
        id: '987'
      }) as InitializedRecord;

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: 'planet-remote-id',
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      fetchStub.withArgs('/moons/987').returns(jsonapiResponse(200));

      await source.push((t) => [
        t.addRecord(planet),
        t.replaceRelatedRecord(moon, 'planet', planet)
      ]);

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');
      assert.equal(
        fetchStub.getCall(1).args[1].method,
        'PATCH',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(1).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(1).args[1].body),
        {
          data: {
            type: 'moon',
            id: '987',
            relationships: {
              planet: { data: { type: 'planet', id: 'planet-remote-id' } }
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - can clear a hasOne relationship with PATCH', async function (assert) {
      assert.expect(5);

      let moon = resourceSerializer.deserialize({
        type: 'moon',
        id: '987'
      }) as InitializedRecord;

      fetchStub.withArgs('/moons/987').returns(jsonapiResponse(200));

      await source.push((t) => t.replaceRelatedRecord(moon, 'planet', null));

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'PATCH',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'moon',
            id: '987',
            relationships: { planet: { data: null } }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - can replace a hasMany relationship with PATCH', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345'
      }) as InitializedRecord;

      let moon = resourceSerializer.deserialize({
        type: 'moon',
        id: '987'
      }) as InitializedRecord;

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(200));

      await source.push((t) =>
        t.replaceRelatedRecords(planet, 'moons', [moon])
      );

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'PATCH',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'planet',
            id: '12345',
            relationships: { moons: { data: [{ type: 'moon', id: '987' }] } }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - a single transform can result in multiple requests', async function (assert) {
      assert.expect(6);

      let planet1 = resourceSerializer.deserialize({
        type: 'planet',
        id: '1'
      }) as InitializedRecord;
      let planet2 = resourceSerializer.deserialize({
        type: 'planet',
        id: '2'
      }) as InitializedRecord;

      fetchStub.withArgs('/planets/1').returns(jsonapiResponse(200));

      fetchStub.withArgs('/planets/2').returns(jsonapiResponse(200));

      await source.push((t) => [
        t.removeRecord(planet1),
        t.removeRecord(planet2)
      ]);

      assert.ok(true, 'records deleted');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');

      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'DELETE',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(0).args[1].body,
        null,
        'fetch called with no data'
      );

      assert.equal(
        fetchStub.getCall(1).args[1].method,
        'DELETE',
        'fetch called with expected method'
      );
      assert.equal(
        fetchStub.getCall(1).args[1].body,
        null,
        'fetch called with no data'
      );
    });

    test('#push - source can limit the number of allowed requests per transform with `maxRequestsPerTransform`', async function (assert) {
      assert.expect(1);

      let planet1 = resourceSerializer.deserialize({
        type: 'planet',
        id: '1'
      }) as InitializedRecord;
      let planet2 = resourceSerializer.deserialize({
        type: 'planet',
        id: '2'
      }) as InitializedRecord;

      source.maxRequestsPerTransform = 1;

      try {
        await source.push((t) => [
          t.removeRecord(planet1),
          t.removeRecord(planet2)
        ]);
      } catch (e) {
        assert.ok(
          e instanceof TransformNotAllowed,
          'TransformNotAllowed thrown'
        );
      }
    });

    test('#push - request can timeout', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      }) as InitializedRecord;

      // 10ms timeout
      source.requestProcessor.defaultFetchSettings.timeout = 10;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, null, 20)); // 20ms delay

      try {
        await source.push((t) =>
          t.replaceAttribute(planet, 'classification', 'terrestrial')
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

    test('#push - allowed timeout can be specified per-request', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      }) as InitializedRecord;

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
        .returns(jsonapiResponse(200, null, 20)); // 20ms delay

      try {
        await source.push(
          (t) => t.replaceAttribute(planet, 'classification', 'terrestrial'),
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

    test('#push - fetch can reject with a NetworkError', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      }) as InitializedRecord;

      fetchStub.withArgs('/planets/12345').returns(Promise.reject(':('));

      try {
        await source.push((t) =>
          t.replaceAttribute(planet, 'classification', 'terrestrial')
        );
        assert.ok(false, 'should not be reached');
      } catch (e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal((e as NetworkError).message, 'Network error: :(');
      }
    });

    test('#push - response can trigger a ClientError', async function (assert) {
      assert.expect(3);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      }) as InitializedRecord;

      let errors = [
        {
          status: '422',
          title: 'Invalid classification specified'
        }
      ];

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(422, { errors }));

      try {
        await source.push((t) =>
          t.replaceAttribute(planet, 'classification', 'terrestrial')
        );
        assert.ok(false, 'should not be reached');
      } catch (e) {
        assert.ok(e instanceof ClientError, 'Client error raised');
        assert.equal(
          (e as ClientError).message,
          'Client error: Unprocessable Entity'
        );
        assert.deepEqual(
          (e as ClientError).data,
          { errors },
          'Error data included'
        );
      }
    });
  });

  module('with no secondary keys', function (hooks) {
    hooks.beforeEach(function () {
      let schema = createSchemaWithoutKeys();
      source = new JSONAPISource({ schema });
    });

    test('#push - addRecord', async function (assert) {
      assert.expect(5);

      let transformCount = 0;

      const planet: InitializedRecord = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      const addPlanetOp: AddRecordOperation = {
        op: 'addRecord',
        record: {
          type: 'planet',
          id: planet.id,
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        }
      };

      source.on('transform', (transform: RecordTransform) => {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            addPlanetOp,
            'transform event initially returns add-record op'
          );
        }
      });

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: planet.id,
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      await source.push((t) => t.addRecord(planet));

      assert.ok(true, 'transform resolves successfully');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(
        fetchStub.getCall(0).args[1].method,
        'POST',
        'fetch called with expected method'
      );
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        {
          data: {
            type: 'planet',
            id: planet.id,
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - can add multiple records in series', async function (assert) {
      assert.expect(8);

      let planet1 = {
        type: 'planet',
        id: 'p1',
        attributes: { name: 'Jupiter' }
      } as InitializedRecord;

      let moon1 = {
        type: 'moon',
        id: 'm1',
        attributes: { name: 'Io' }
      } as InitializedRecord;

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: planet1
        })
      );
      fetchStub.withArgs('/moons').returns(
        jsonapiResponse(201, {
          data: moon1
        })
      );

      await source.push((t) => [t.addRecord(planet1), t.addRecord(moon1)]);

      assert.ok(true, 'push resolves successfully');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');

      const firstFetchCall = fetchStub.getCall(0);
      assert.equal(
        firstFetchCall.args[1].method,
        'POST',
        'fetch called with expected method'
      );
      assert.equal(
        firstFetchCall.args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(firstFetchCall.args[1].body),
        {
          data: planet1
        },
        'fetch called with expected data'
      );

      const secondFetchCall = fetchStub.getCall(1);
      assert.equal(
        secondFetchCall.args[1].method,
        'POST',
        'fetch called with expected method'
      );
      assert.equal(
        secondFetchCall.args[1].headers['Content-Type'],
        'application/vnd.api+json',
        'fetch called with expected content type'
      );
      assert.deepEqual(
        JSON.parse(secondFetchCall.args[1].body),
        {
          data: moon1
        },
        'fetch called with expected data'
      );
    });

    test('#push - addRecord - url option can be passed', async function (assert) {
      assert.expect(1);

      const planet = {
        id: '12345',
        type: 'planet',
        attributes: { name: 'Jupiter' }
      };

      fetchStub.withArgs('/custom/path/here').returns(
        jsonapiResponse(201, {
          data: planet
        })
      );

      await source.push((t) => t.addRecord(planet), {
        url: '/custom/path/here'
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#push - updateRecord - url option can be passed', async function (assert) {
      assert.expect(1);

      fetchStub.withArgs('/custom/path/here').returns(jsonapiResponse(200));

      await source.push((t) => t.updateRecord({ type: 'planet', id: '123' }), {
        url: '/custom/path/here'
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#push - removeRecord - url option can be passed', async function (assert) {
      assert.expect(1);

      fetchStub.withArgs('/custom/path/here').returns(jsonapiResponse(200));

      await source.push((t) => t.removeRecord({ type: 'planet', id: '123' }), {
        url: '/custom/path/here'
      });

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#push - addToRelatedRecords - url option can be passed', async function (assert) {
      assert.expect(1);

      fetchStub.withArgs('/custom/path/here').returns(jsonapiResponse(200));

      await source.push(
        (t) =>
          t.addToRelatedRecords({ type: 'planet', id: '123' }, 'moons', {
            type: 'moon',
            id: 'io'
          }),
        {
          url: '/custom/path/here'
        }
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#push - removeFromRelatedRecords - url option can be passed', async function (assert) {
      assert.expect(1);

      fetchStub.withArgs('/custom/path/here').returns(jsonapiResponse(200));

      await source.push(
        (t) =>
          t.removeFromRelatedRecords({ type: 'planet', id: '123' }, 'moons', {
            type: 'moon',
            id: 'io'
          }),
        {
          url: '/custom/path/here'
        }
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#push - replaceRelatedRecords - url option can be passed', async function (assert) {
      assert.expect(1);

      fetchStub.withArgs('/custom/path/here').returns(jsonapiResponse(200));

      await source.push(
        (t) =>
          t.replaceRelatedRecords({ type: 'planet', id: '123' }, 'moons', [
            {
              type: 'moon',
              id: 'io'
            }
          ]),
        {
          url: '/custom/path/here'
        }
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });

    test('#push - replaceRelatedRecord - url option can be passed', async function (assert) {
      assert.expect(1);

      fetchStub.withArgs('/custom/path/here').returns(jsonapiResponse(200));

      await source.push(
        (t) =>
          t.replaceRelatedRecord({ type: 'planet', id: '123' }, 'solarSystem', {
            type: 'solarSystem',
            id: '1'
          }),
        {
          url: '/custom/path/here'
        }
      );

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
    });
  });
});
