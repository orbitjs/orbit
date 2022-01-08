import { buildTransform, TransformNotAllowed } from '@orbit/data';
import {
  AddRecordOperation,
  RecordKeyMap,
  InitializedRecord,
  RecordIdentity,
  UpdateRecordOperation,
  RecordSchema,
  RecordSource,
  RecordSchemaSettings,
  ReplaceKeyOperation,
  RecordOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  RecordTransform
} from '@orbit/records';
import { toArray } from '@orbit/utils';
import { jsonapiResponse } from './support/jsonapi';
import { JSONAPISource } from '../src/jsonapi-source';
import { Resource, ResourceDocument } from '../src/resource-document';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { JSONAPISerializers } from '../src/serializers/jsonapi-serializers';
import { buildSerializerSettingsFor } from '@orbit/serializers';
import { JSONAPIResourceSerializer } from '../src/serializers/jsonapi-resource-serializer';
import { JSONAPIResourceIdentitySerializer } from '../src/serializers/jsonapi-resource-identity-serializer';
import { ClientError, NetworkError } from '../src/lib/exceptions';

const { module, test } = QUnit;

module('JSONAPISource with legacy serialization settings', function () {
  let fetchStub: SinonStub;
  let keyMap: RecordKeyMap;
  let schema: RecordSchema;
  let source: JSONAPISource;
  let resourceSerializer: JSONAPIResourceSerializer;

  const serializerSettingsFor = buildSerializerSettingsFor({
    settingsByType: {
      [JSONAPISerializers.ResourceField]: {
        serializationOptions: { inflectors: ['dasherize'] }
      },
      [JSONAPISerializers.ResourceFieldParam]: {
        serializationOptions: { inflectors: ['dasherize'] }
      },
      [JSONAPISerializers.ResourceFieldPath]: {
        serializationOptions: { inflectors: ['dasherize'] }
      },
      [JSONAPISerializers.ResourceType]: {
        serializationOptions: { inflectors: ['pluralize', 'dasherize'] }
      },
      [JSONAPISerializers.ResourceTypePath]: {
        serializationOptions: { inflectors: ['pluralize', 'dasherize'] }
      }
    }
  });

  module('with a secondary key', function (hooks) {
    hooks.beforeEach(() => {
      fetchStub = sinon.stub(self, 'fetch');

      schema = new RecordSchema({
        models: {
          planet: {
            keys: {
              remoteId: {}
            },
            attributes: {
              name: { type: 'string' },
              classification: { type: 'string' },
              lengthOfDay: { type: 'number' }
            },
            relationships: {
              moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
              solarSystem: {
                kind: 'hasOne',
                type: 'solarSystem',
                inverse: 'planets'
              }
            }
          },
          moon: {
            keys: {
              remoteId: {}
            },
            attributes: {
              name: { type: 'string' }
            },
            relationships: {
              planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
            }
          },
          solarSystem: {
            keys: {
              remoteId: {}
            },
            attributes: {
              name: { type: 'string' }
            },
            relationships: {
              planets: {
                kind: 'hasMany',
                type: 'planet',
                inverse: 'solarSystem'
              },
              moons: {
                kind: 'hasMany',
                type: 'moon',
                inverse: 'solarSystem'
              }
            }
          }
        }
      });

      keyMap = new RecordKeyMap();
      source = new JSONAPISource({
        schema,
        keyMap,
        serializerSettingsFor
      });
      resourceSerializer = source.requestProcessor.serializerFor(
        JSONAPISerializers.Resource
      ) as JSONAPIResourceSerializer;
    });

    hooks.afterEach(() => {
      fetchStub.restore();
    });

    test('it exists', function (assert) {
      assert.ok(source);
    });

    test('its prototype chain is correct', function (assert) {
      assert.ok(source instanceof RecordSource, 'instanceof Source');
    });

    test('source has default settings', function (assert) {
      assert.expect(2);

      let schema = new RecordSchema({} as RecordSchemaSettings);
      source = new JSONAPISource({ schema });
      assert.equal(source.name, 'jsonapi', 'name is set to default');
      assert.deepEqual(
        source.requestProcessor.allowedContentTypes,
        ['application/vnd.api+json', 'application/json'],
        'allowedContentTypes are set to default'
      );
    });

    test('source saves options', function (assert) {
      assert.expect(4);

      let schema = new RecordSchema({} as RecordSchemaSettings);
      source = new JSONAPISource({
        schema,
        keyMap,
        host: '127.0.0.1:8888',
        name: 'custom',
        namespace: 'api',
        allowedContentTypes: ['application/custom'],
        defaultFetchSettings: {
          headers: { 'User-Agent': 'CERN-LineMode/2.15 libwww/2.17b3' }
        }
      });
      assert.equal(source.name, 'custom', 'name is custom');
      assert.deepEqual(
        source.requestProcessor.allowedContentTypes,
        ['application/custom'],
        'allowedContentTypes are custom'
      );
      assert.equal(
        source.requestProcessor.urlBuilder.resourceNamespace(),
        'api',
        'Default namespace should be used by default'
      );
      assert.equal(
        source.requestProcessor.urlBuilder.resourceHost(),
        '127.0.0.1:8888',
        'Default host should be used by default'
      );
    });

    test('#defaultFetchSettings - include JSONAPI Accept and Content-Type headers and a 5000ms timeout by default', function (assert) {
      assert.deepEqual(source.requestProcessor.defaultFetchSettings, {
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        },
        timeout: 5000
      });
    });

    test('#defaultFetchSettings can be passed and will override any defaults set', function (assert) {
      let customSource = new JSONAPISource({
        schema,
        defaultFetchSettings: {
          headers: {
            Accept: 'application/json'
          },
          timeout: 0
        }
      });
      assert.deepEqual(customSource.requestProcessor.defaultFetchSettings, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/vnd.api+json'
        },
        timeout: 0
      });
    });

    test('#push - can add records', async function (assert) {
      assert.expect(9);

      let transformCount = 0;

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      });

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
            type: 'planets',
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
            type: 'planets',
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

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      }) as InitializedRecord;

      const t = buildTransform({
        op: 'addRecord',
        record: planet
      } as AddRecordOperation);

      source.on('beforePush', async function (transform: RecordTransform) {
        await source.transformLog.append(t.id);
      });

      let result = (await source.push(t)) as RecordTransform[];

      assert.deepEqual(result, [], 'result represents transforms applied');
      assert.ok(source.transformLog.contains(t.id), 'log contains transform');
    });

    test('#push - can add sideloaded records', async function (assert) {
      assert.expect(8);

      let transformCount = 0;

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      });

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
            type: 'planets',
            attributes: { name: 'Jupiter', classification: 'gas giant' },
            relationships: { moons: [{ id: '321', type: 'moons' }] }
          },
          included: [
            {
              id: '321',
              type: 'moons',
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
            type: 'planets',
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
        type: 'planets',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      }) as InitializedRecord;

      fetchStub.withArgs('/planets?include=moons').returns(
        jsonapiResponse(201, {
          data: {
            id: '12345',
            type: 'planets',
            attributes: { name: 'Jupiter', classification: 'gas giant' },
            relationships: { moons: [{ id: '321', type: 'moons' }] }
          },
          included: [
            {
              id: '321',
              type: 'moons',
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
        type: 'planets',
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
            type: 'planets',
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
            type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

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
            type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub.withArgs('/planets/12345').returns(
        jsonapiResponse(200, {
          data: {
            type: 'planets',
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
      assert.deepEqual(
        toArray(transforms[1].operations).map(
          (o) => (o as ReplaceKeyOperation).value
        ),
        ['Mars', 'remote-id-123']
      );
    });

    test('#push - can delete records', async function (assert) {
      assert.expect(4);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

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
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

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
        { data: [{ type: 'moons', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#push - can remove a relationship with DELETE', async function (assert) {
      assert.expect(4);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

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
        { data: [{ type: 'moons', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#push - can update a hasOne relationship with PATCH', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

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
            type: 'moons',
            id: '987',
            relationships: {
              planet: { data: { type: 'planets', id: '12345' } }
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

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: 'planet-remote-id',
            type: 'planets',
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
            type: 'moons',
            id: '987',
            relationships: {
              planet: { data: { type: 'planets', id: 'planet-remote-id' } }
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - can clear a hasOne relationship with PATCH', async function (assert) {
      assert.expect(5);

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

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
            type: 'moons',
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
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

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
            type: 'planets',
            id: '12345',
            relationships: { moons: { data: [{ type: 'moons', id: '987' }] } }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#push - a single transform can result in multiple requests', async function (assert) {
      assert.expect(6);

      const planet1: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '1'
      });

      const planet2: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '2'
      });

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

      const planet1: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '1'
      });

      const planet2: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '2'
      });

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
        type: 'planets',
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
        type: 'planets',
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
        type: 'planets',
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
        type: 'planets',
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

    test('#update - can add records', async function (assert) {
      assert.expect(7);

      let transformCount = 0;

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      });

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
            type: 'planets',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      await source.update((t) => t.addRecord(planet));

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
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#update - can add sideloaded records', async function (assert) {
      assert.expect(8);

      let transformCount = 0;

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      });

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

      let addMoonOp = {
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
            type: 'planets',
            attributes: { name: 'Jupiter', classification: 'gas giant' },
            relationships: { moons: [{ id: '321', type: 'moons' }] }
          },
          included: [
            {
              id: '321',
              type: 'moons',
              attributes: {
                name: 'Europa'
              }
            }
          ]
        })
      );

      await source.update((t) => t.addRecord(planet));

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
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#update - can transform records', async function (assert) {
      assert.expect(6);

      let transformCount = 0;

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      }) as InitializedRecord;

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
            type: 'planets',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      await source.update((t) => t.updateRecord(planet));

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
            type: 'planets',
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

    test('#update - can replace a single attribute', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(204));

      await source.update((t) =>
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
            type: 'planets',
            id: '12345',
            attributes: {
              classification: 'terrestrial'
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#update - can accept remote changes', async function (assert) {
      assert.expect(3);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub.withArgs('/planets/12345').returns(
        jsonapiResponse(200, {
          data: {
            type: 'planets',
            id: 'remote-id-123',
            attributes: {
              name: 'Mars',
              classification: 'terrestrial'
            }
          }
        })
      );

      let transforms: RecordTransform[] = [];
      source.on('transform', (transform: RecordTransform) => {
        transforms.push(transform);
      });

      let data = await source.update((t) =>
        t.replaceAttribute(planet, 'classification', 'terrestrial')
      );

      assert.deepEqual(
        toArray(transforms[1].operations).map((o) => o.op),
        ['replaceAttribute', 'replaceKey']
      );
      assert.deepEqual(
        toArray(transforms[1].operations).map(
          (o) => (o as ReplaceKeyOperation).value
        ),
        ['Mars', 'remote-id-123']
      );
      assert.deepEqual(data, {
        type: 'planet',
        id: planet.id,
        keys: {
          remoteId: 'remote-id-123'
        },
        attributes: {
          name: 'Mars',
          classification: 'terrestrial'
        }
      });
    });

    test('#update - can delete records', async function (assert) {
      assert.expect(4);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(200));

      await source.update((t) => t.removeRecord(planet));

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

    test('#update - can add a hasMany relationship with POST', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

      fetchStub
        .withArgs('/planets/12345/relationships/moons')
        .returns(jsonapiResponse(204));

      await source.update((t) => t.addToRelatedRecords(planet, 'moons', moon));

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
        { data: [{ type: 'moons', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#update - can remove a relationship with DELETE', async function (assert) {
      assert.expect(4);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

      fetchStub
        .withArgs('/planets/12345/relationships/moons')
        .returns(jsonapiResponse(200));

      await source.update((t) =>
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
        { data: [{ type: 'moons', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#update - can update a hasOne relationship with PATCH', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

      fetchStub.withArgs('/moons/987').returns(jsonapiResponse(200));

      await source.update((t) =>
        t.replaceRelatedRecord(moon, 'planet', planet)
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
            type: 'moons',
            id: '987',
            relationships: {
              planet: { data: { type: 'planets', id: '12345' } }
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#update - can update a hasOne relationship with PATCH with newly created record', async function (assert) {
      assert.expect(5);

      let planet = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: 'planet-remote-id',
            type: 'planets',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      fetchStub.withArgs('/moons/987').returns(jsonapiResponse(200));

      await source.update((t) => [
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
            type: 'moons',
            id: '987',
            relationships: {
              planet: { data: { type: 'planets', id: 'planet-remote-id' } }
            }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#update - can clear a hasOne relationship with PATCH', async function (assert) {
      assert.expect(5);

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

      fetchStub.withArgs('/moons/987').returns(jsonapiResponse(200));

      await source.update((t) => t.replaceRelatedRecord(moon, 'planet', null));

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
            type: 'moons',
            id: '987',
            relationships: { planet: { data: null } }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#update - can replace a hasMany relationship with PATCH', async function (assert) {
      assert.expect(5);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      });

      const moon: InitializedRecord = resourceSerializer.deserialize({
        type: 'moons',
        id: '987'
      });

      fetchStub.withArgs('/planets/12345').returns(jsonapiResponse(200));

      await source.update((t) =>
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
            type: 'planets',
            id: '12345',
            relationships: { moons: { data: [{ type: 'moons', id: '987' }] } }
          }
        },
        'fetch called with expected data'
      );
    });

    test('#update - a single transform can result in multiple requests', async function (assert) {
      assert.expect(6);

      let planet1: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '1'
      });

      let planet2: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '2'
      });

      fetchStub.withArgs('/planets/1').returns(jsonapiResponse(200));

      fetchStub.withArgs('/planets/2').returns(jsonapiResponse(200));

      await source.update((t) => [
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

    test('#update - source can limit the number of allowed requests per transform with `maxRequestsPerTransform`', async function (assert) {
      assert.expect(1);

      const planet1: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '1'
      });

      const planet2: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '2'
      });

      source.maxRequestsPerTransform = 1;

      try {
        await source.update((t) => [
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

    test('#update - request can timeout', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        await source.update((t) =>
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

    test('#update - allowed timeout can be specified per-request', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        await source.update(
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

    test('#update - fetch can reject with a NetworkError', async function (assert) {
      assert.expect(2);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub.withArgs('/planets/12345').returns(Promise.reject(':('));

      try {
        await source.update((t) =>
          t.replaceAttribute(planet, 'classification', 'terrestrial')
        );
        assert.ok(false, 'should not be reached');
      } catch (e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal((e as NetworkError).message, 'Network error: :(');
      }
    });

    test('#update - response can trigger a ClientError', async function (assert) {
      assert.expect(3);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

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
        await source.update((t) =>
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

    test('#pull - record', async function (assert) {
      assert.expect(6);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
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
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('filter[length-of-day]')}=24`)
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
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          }
        }
      ];

      const value1 = encodeURIComponent('le:24');
      const value2 = encodeURIComponent('ge:24');
      const attribute = encodeURIComponent('filter[length-of-day]');
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
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
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
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
          }
        },
        {
          id: 'phobos',
          type: 'moons',
          attributes: { name: 'Phobos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
          }
        },
        {
          id: 'deimos',
          type: 'moons',
          attributes: { name: 'Deimos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
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
          type: 'planets',
          attributes: { name: 'Mars' },
          relationships: {
            moons: {
              data: [
                { id: 'phobos', type: 'moons' },
                { id: 'deimos', type: 'moons' }
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
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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
          type: 'planets',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant',
            lengthOfDay: 9.9
          }
        },
        {
          type: 'planets',
          attributes: {
            name: 'Saturn',
            classification: 'gas giant',
            lengthOfDay: 10.7
          }
        },
        {
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24.0
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?sort=${encodeURIComponent('length-of-day,name')}`)
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
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          },
          relationships: {
            solarSystem: {
              data: {
                type: 'solar-systems',
                id: 'sun'
              }
            }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/planets?${encodeURIComponent(
            'filter[length-of-day]'
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

      const op1 = ops[0] as UpdateRecordOperation;

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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          }
        }
      ];

      const value1 = encodeURIComponent('le:24');
      const value2 = encodeURIComponent('ge:24');
      const attribute = encodeURIComponent('filter[length-of-day]');
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

      const op1 = ops[0] as UpdateRecordOperation;

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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
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

      const op1 = ops[0] as UpdateRecordOperation;

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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
          }
        },
        {
          id: 'phobos',
          type: 'moons',
          attributes: { name: 'Phobos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
          }
        },
        {
          id: 'deimos',
          type: 'moons',
          attributes: { name: 'Deimos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          id: 'mars',
          type: 'planets',
          attributes: { name: 'Mars' },
          relationships: {
            moons: {
              data: [
                { id: 'phobos', type: 'moons' },
                { id: 'deimos', type: 'moons' }
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

      const op1 = ops[0] as UpdateRecordOperation;

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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant',
            lengthOfDay: 9.9
          }
        },
        {
          type: 'planets',
          attributes: {
            name: 'Saturn',
            classification: 'gas giant',
            lengthOfDay: 10.7
          }
        },
        {
          type: 'planets',
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
            'length-of-day,name'
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
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
        type: 'planets',
        id: 'jupiter'
      }) as InitializedRecord;

      const data: Resource = {
        type: 'solar-systems',
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
        type: 'planets',
        id: 'jupiter'
      }) as InitializedRecord;

      let data = [
        {
          type: 'moons',
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
        type: 'planets',
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

    test('#query - record', async function (assert) {
      assert.expect(4);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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

    test('#query - record (304 response)', async function (assert) {
      assert.expect(3);

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter' }
      };

      const planet1 = resourceSerializer.deserialize({
        type: 'planets',
        id: '12345'
      }) as InitializedRecord;

      const data2: Resource = {
        type: 'planets',
        id: '1234',
        attributes: { name: 'Earth' }
      };

      const planet2 = resourceSerializer.deserialize({
        type: 'planets',
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
      assert.equal(
        (records[0] as InitializedRecord).attributes?.name,
        'Jupiter'
      );
      assert.equal((records[1] as InitializedRecord).attributes?.name, 'Earth');

      assert.equal(fetchStub.callCount, 2, 'fetch called once');
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };
      const meta = {
        'important-info': 'goes-here'
      };
      let responseDoc = { data, meta };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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

    test('#query - request can timeout', async function (assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' },
        relationships: { moons: { data: [] } }
      };

      const planet: InitializedRecord = resourceSerializer.deserialize({
        type: 'planets',
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
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
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

    test('#query - records with attribute filter', async function (assert) {
      assert.expect(5);

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('filter[length-of-day]')}=24`)
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

    test('#query - records with relatedRecord filter (single value)', async function (assert) {
      assert.expect(5);

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
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
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
          }
        },
        {
          id: 'phobos',
          type: 'moons',
          attributes: { name: 'Phobos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
          }
        },
        {
          id: 'deimos',
          type: 'moons',
          attributes: { name: 'Deimos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
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
          type: 'planets',
          attributes: { name: 'Mars' },
          relationships: {
            moons: {
              data: [
                { id: 'phobos', type: 'moons' },
                { id: 'deimos', type: 'moons' }
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
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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
          type: 'planets',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant',
            lengthOfDay: 9.9
          }
        },
        {
          type: 'planets',
          attributes: {
            name: 'Saturn',
            classification: 'gas giant',
            lengthOfDay: 10.7
          }
        },
        {
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24.0
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?sort=${encodeURIComponent('length-of-day,name')}`)
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
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: {
            name: 'Earth',
            classification: 'terrestrial',
            lengthOfDay: 24
          },
          relationships: {
            solarSystem: {
              data: {
                type: 'solar-systems',
                id: 'sun'
              }
            }
          }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/planets?${encodeURIComponent(
            'filter[length-of-day]'
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          id: 'moon',
          type: 'moons',
          attributes: { name: 'Moon' },
          relationships: {
            planet: { data: { id: 'earth', type: 'planets' } }
          }
        },
        {
          id: 'phobos',
          type: 'moons',
          attributes: { name: 'Phobos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
          }
        },
        {
          id: 'deimos',
          type: 'moons',
          attributes: { name: 'Deimos' },
          relationships: {
            planet: { data: { id: 'mars', type: 'planets' } }
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          id: 'mars',
          type: 'planets',
          attributes: { name: 'Mars' },
          relationships: {
            moons: {
              data: [
                { id: 'phobos', type: 'moons' },
                { id: 'deimos', type: 'moons' }
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
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

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant',
            lengthOfDay: 9.9
          }
        },
        {
          type: 'planets',
          attributes: {
            name: 'Saturn',
            classification: 'gas giant',
            lengthOfDay: 10.7
          }
        },
        {
          type: 'planets',
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
            'length-of-day,name'
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
      assert.expect(5);

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

      const data: Resource[] = [
        {
          type: 'planets',
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        {
          type: 'planets',
          attributes: { name: 'Earth', classification: 'terrestrial' }
        },
        {
          type: 'planets',
          attributes: { name: 'Saturn', classification: 'gas giant' }
        }
      ];

      fetchStub
        .withArgs(
          `/solar-systems/sun/planets?${encodeURIComponent(
            'page[offset]'
          )}=1&${encodeURIComponent('page[limit]')}=10`
        )
        .returns(jsonapiResponse(200, { data }));

      let records = (await source.query((q) =>
        q
          .findRelatedRecords(solarSystem, 'planets')
          .page({ offset: 1, limit: 10 })
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

    test('#query - related record (304 response)', async function (assert) {
      assert.expect(3);

      fetchStub
        .withArgs('/planets/earth/solar-system')
        .returns(jsonapiResponse(304));

      const earth = resourceSerializer.deserialize({
        type: 'planets',
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

    test('#query - related records (304 response)', async function (assert) {
      assert.expect(3);

      fetchStub
        .withArgs('/solar-systems/sun/planets')
        .returns(jsonapiResponse(304));

      const solarSystem: InitializedRecord = resourceSerializer.deserialize({
        type: 'solar-systems',
        id: 'sun'
      });

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
            { type: 'planets', id: '1' },
            { type: 'planets', id: '2' }
          ],
          included: [
            { type: 'moons', id: '1' },
            { type: 'moons', id: '2' }
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
        type: 'planets',
        id: 'jupiter'
      }) as InitializedRecord;

      let data = [
        {
          type: 'moons',
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
        type: 'planets',
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
      fetchStub = sinon.stub(self, 'fetch');

      let schema = new RecordSchema({
        models: {
          planet: {
            attributes: {
              name: { type: 'string' },
              classification: { type: 'string' },
              lengthOfDay: { type: 'number' }
            },
            relationships: {
              moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
              solarSystem: {
                kind: 'hasOne',
                type: 'solarSystem',
                inverse: 'planets'
              }
            }
          },
          moon: {
            attributes: {
              name: { type: 'string' }
            },
            relationships: {
              planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
            }
          },
          solarSystem: {
            attributes: {
              name: { type: 'string' }
            },
            relationships: {
              planets: {
                kind: 'hasMany',
                type: 'planet',
                inverse: 'solarSystem'
              },
              moons: {
                kind: 'hasMany',
                type: 'moon',
                inverse: 'solarSystem'
              }
            }
          }
        }
      });

      source = new JSONAPISource({ schema, serializerSettingsFor });
    });

    hooks.afterEach(function () {
      fetchStub.restore();
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
            type: 'planets',
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
            type: 'planets',
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

    test('#query - findRecord - url option can be passed', async function (assert) {
      assert.expect(1);

      const planetResource = {
        id: '12345',
        type: 'planets',
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
        type: 'planets',
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
  });
});
