import Orbit, {
  ClientError,
  KeyMap,
  NetworkError,
  Record,
  RecordIdentity,
  UpdateRecordOperation,
  TransformNotAllowed,
  Schema,
  Source,
  SchemaSettings,
  ReplaceKeyOperation,
  RecordOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  Transform
} from '@orbit/data';
import { jsonapiResponse } from './support/jsonapi';
import JSONAPISource, { Resource } from '../src/index';
import { SinonStatic, SinonStub} from 'sinon';
import { ResourceDocument } from '../dist/types';

declare const sinon: SinonStatic;
const { module, test } = QUnit;

module('JSONAPISource', function() {
  let fetchStub: SinonStub;
  let keyMap: KeyMap;
  let schema: Schema;
  let source: JSONAPISource;

  module('with a secondary key', function(hooks) {
    hooks.beforeEach(() => {
      fetchStub = sinon.stub(self, 'fetch');

      schema = new Schema({
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
              moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
              solarSystem: { type: 'hasOne', model: 'solarSystem', inverse: 'planets' }
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
              planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
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
              planets: { type: 'hasMany', model: 'planet', inverse: 'solarSystem' }
            }
          }
        }
      });

      keyMap = new KeyMap();
      source = new JSONAPISource({ schema, keyMap });

      source.requestProcessor.serializer.resourceKey = function() { return 'remoteId'; };
    });

    hooks.afterEach(() => {
      keyMap = schema = source = null;
      fetchStub.restore();
    });

    test('it exists', function(assert) {
      assert.ok(source);
    });

    test('its prototype chain is correct', function(assert) {
      assert.ok(source instanceof Source, 'instanceof Source');
    });

    test('source has default settings', function(assert) {
      assert.expect(2);

      let schema = new Schema({} as SchemaSettings);
      source = new JSONAPISource({ schema });
      assert.equal(source.name, 'jsonapi', 'name is set to default');
      assert.deepEqual(source.allowedContentTypes, ['application/vnd.api+json', 'application/json'], 'allowedContentTypes are set to default');
    });

     test('source saves options', function(assert) {
      assert.expect(7);

      let schema = new Schema({} as SchemaSettings);
      source = new JSONAPISource({
        schema,
        keyMap,
        host: '127.0.0.1:8888',
        name: 'custom',
        namespace: 'api',
        allowedContentTypes: ['application/custom'],
        defaultFetchSettings: { headers: { 'User-Agent': 'CERN-LineMode/2.15 libwww/2.17b3' } }
      });
      assert.equal(source.name, 'custom', 'name is custom');
      assert.deepEqual(source.allowedContentTypes, ['application/custom'], 'allowedContentTypes are custom');
      assert.equal(source.requestProcessor.namespace, 'api', 'Namespace should be defined');
      assert.equal(source.requestProcessor.host, '127.0.0.1:8888', 'Host should be defined');

      const headers = source.defaultFetchSettings.headers as any;
      assert.equal(headers['User-Agent'], 'CERN-LineMode/2.15 libwww/2.17b3', 'Headers should be defined');
      assert.equal(source.requestProcessor.urlBuilder.resourceNamespace(), 'api', 'Default namespace should be used by default');
      assert.equal(source.requestProcessor.urlBuilder.resourceHost(), '127.0.0.1:8888', 'Default host should be used by default');
    });

    test('#defaultFetchSettings - include JSONAPI Accept and Content-Type headers and a 5000ms timeout by default', function(assert) {
      assert.deepEqual(source.defaultFetchSettings,
        {
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          },
          timeout: 5000
        });
    });

    test('#defaultFetchSettings can be passed and will override any defaults set', function(assert) {
      let customSource = new JSONAPISource({
        schema,
        defaultFetchSettings: {
          headers: {
            Accept: 'application/json'
          },
          timeout: null
        }
      });
      assert.deepEqual(customSource.defaultFetchSettings,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/vnd.api+json'
          },
          timeout: null
        });
    });

    test('#push - can add records', async function(assert) {
      assert.expect(7);

      let transformCount = 0;

      let planet: Record = source.requestProcessor.serializer.deserializeResource({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

      let addPlanetOp = {
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

      let addPlanetRemoteIdOp = {
        op: 'replaceKey',
        record: { type: 'planet', id: planet.id },
        key: 'remoteId',
        value: '12345'
      } as ReplaceKeyOperation;

      source.on('transform', function(transform: Transform) {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            [addPlanetOp],
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

      fetchStub
        .withArgs('/planets')
        .returns(jsonapiResponse(201, {
          data: { id: '12345', type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
        }));

      await source.push(t => t.addRecord(planet));

      assert.ok(true, 'transform resolves successfully');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'POST', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
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

    test('#push - can add sideloaded records', async function (assert) {
      assert.expect(8);

      let transformCount = 0;

      let planet: Record = source.requestProcessor.serializer.deserializeResource({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

      let addPlanetOp = {
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

      let addPlanetRemoteIdOp = {
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

      source.on('transform', (transform: Transform) => {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            [addPlanetOp],
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
          let operationsWithoutId = transform.operations.map(op => {
            let clonedOp = Object.assign({}, op) as RecordOperation;
            delete clonedOp.record.id;
            return clonedOp;
          });
          assert.deepEqual(
            operationsWithoutId,
            [addMoonOp as any],
            'transform event to add included records'
          );
        }
      });

      fetchStub
        .withArgs('/planets')
        .returns(jsonapiResponse(201, {
          data: {
            id: '12345',
            type: 'planets',
            attributes: { name: 'Jupiter', classification: 'gas giant' },
            relationships: { moons: [{ id: '321', type: 'moons' }] }
          },
          included: [{
            id: '321',
            type: 'moons',
            attributes: {
              name: 'Europa'
            }
          }]
        }));

      await source.push(t => t.addRecord(planet));

      assert.ok(true, 'transform resolves successfully');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'POST', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
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

    test('#push - can transform records', async function(assert) {
      assert.expect(6);

      let transformCount = 0;

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      let replacePlanetOp = {
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

      source.on('transform', (transform: Transform) => {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            [replacePlanetOp],
            'transform event initially returns replace-record op'
          );
        }
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(
          jsonapiResponse(
            200,
            { data: { id: '12345', type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } } }
          )
        );

      await source.push(t => t.updateRecord(planet));

      assert.ok(true, 'transform resolves successfully');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
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

    test('#push - can replace a single attribute', async function(assert) {
      assert.expect(5);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(204));

      await source.push(t => t.replaceAttribute(planet, 'classification', 'terrestrial'));

      assert.ok(true, 'record patched');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
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

    test('#push - can accept remote changes', async function(assert) {
      assert.expect(2);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, {
          data: {
            type: 'planets',
            id: 'remote-id-123',
            attributes: {
              name: 'Mars',
              classification: 'terrestrial'
            }
          }
        }));

      let transforms = await source.push(t => t.replaceAttribute(planet, 'classification', 'terrestrial'));

      assert.deepEqual(transforms[1].operations.map(o => o.op), ['replaceAttribute', 'replaceKey']);
      assert.deepEqual(transforms[1].operations.map((o: ReplaceKeyOperation) => o.value), ['Mars', 'remote-id-123']);
    });

    test('#push - can delete records', async function(assert) {
      assert.expect(4);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200));

      await source.push(t => t.removeRecord(planet));

      assert.ok(true, 'record deleted');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'DELETE', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].body, null, 'fetch called with no data');
    });

    test('#push - can add a hasMany relationship with POST', async function(assert) {
      assert.expect(5);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      let moon = source.requestProcessor.serializer.deserializeResource({
        type: 'moon',
        id: '987'
      });

      fetchStub
        .withArgs('/planets/12345/relationships/moons')
        .returns(jsonapiResponse(204));

      await source.push(t => t.addToRelatedRecords(planet, 'moons', moon));

      assert.ok(true, 'records linked');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'POST', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        { data: [{ type: 'moons', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#push - can remove a relationship with DELETE', async function(assert) {
      assert.expect(4);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      let moon = source.requestProcessor.serializer.deserializeResource({
        type: 'moon',
        id: '987'
      });

      fetchStub
        .withArgs('/planets/12345/relationships/moons')
        .returns(jsonapiResponse(200));

      await source.push(t => t.removeFromRelatedRecords(planet, 'moons', moon));

      assert.ok(true, 'records unlinked');
      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'DELETE', 'fetch called with expected method');
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        { data: [{ type: 'moons', id: '987' }] },
        'fetch called with expected data'
      );
    });

    test('#push - can update a hasOne relationship with PATCH', async function(assert) {
      assert.expect(5);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      let moon = source.requestProcessor.serializer.deserializeResource({
        type: 'moon',
        id: '987'
      });

      fetchStub
        .withArgs('/moons/987')
        .returns(jsonapiResponse(200));

      await source.push(t => t.replaceRelatedRecord(moon, 'planet', planet));

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        { data: { type: 'moons', id: '987', relationships: { planet: { data: { type: 'planets', id: '12345' } } } } },
        'fetch called with expected data'
      );
    });

    test('#push - can update a hasOne relationship with PATCH with newly created record', async function(assert) {
      assert.expect(5);

      let planet = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      let moon = source.requestProcessor.serializer.deserializeResource({
        type: 'moon',
        id: '987'
      });

      fetchStub
        .withArgs('/planets')
        .returns(jsonapiResponse(201, {
          data: { id: 'planet-remote-id', type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
        }));

      fetchStub
        .withArgs('/moons/987')
        .returns(jsonapiResponse(200));

      await source.push(t => [
        t.addRecord(planet),
        t.replaceRelatedRecord(moon, 'planet', planet)
      ]);

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');
      assert.equal(fetchStub.getCall(1).args[1].method, 'PATCH', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(1).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(1).args[1].body),
        { data: { type: 'moons', id: '987', relationships: { planet: { data: { type: 'planets', id: 'planet-remote-id' } } } } },
        'fetch called with expected data'
      );
    });

    test('#push - can clear a hasOne relationship with PATCH', async function(assert) {
      assert.expect(5);

      let moon = source.requestProcessor.serializer.deserializeResource({
        type: 'moon',
        id: '987'
      });

      fetchStub
        .withArgs('/moons/987')
        .returns(jsonapiResponse(200));

      await source.push(t => t.replaceRelatedRecord(moon, 'planet', null));

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        { data: { type: 'moons', id: '987', relationships: { planet: { data: null } } } },
        'fetch called with expected data'
      );
    });

    test('#push - can replace a hasMany relationship with PATCH', async function(assert) {
      assert.expect(5);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      let moon = source.requestProcessor.serializer.deserializeResource({
        type: 'moon',
        id: '987'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200));

      await source.push(t => t.replaceRelatedRecords(planet, 'moons', [moon]));

      assert.ok(true, 'relationship replaced');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].headers['Content-Type'], 'application/vnd.api+json', 'fetch called with expected content type');
      assert.deepEqual(
        JSON.parse(fetchStub.getCall(0).args[1].body),
        { data: { type: 'planets', id: '12345', relationships: { moons: { data: [{ type: 'moons', id: '987' }] } } } },
        'fetch called with expected data'
      );
    });

    test('#push - a single transform can result in multiple requests', async function(assert) {
      assert.expect(6);

      let planet1 = source.requestProcessor.serializer.deserializeResource({ type: 'planet', id: '1' });
      let planet2 = source.requestProcessor.serializer.deserializeResource({ type: 'planet', id: '2' });

      fetchStub
        .withArgs('/planets/1')
        .returns(jsonapiResponse(200));

      fetchStub
        .withArgs('/planets/2')
        .returns(jsonapiResponse(200));

      await source.push(t => [
        t.removeRecord(planet1),
        t.removeRecord(planet2)
      ]);

      assert.ok(true, 'records deleted');

      assert.equal(fetchStub.callCount, 2, 'fetch called twice');

      assert.equal(fetchStub.getCall(0).args[1].method, 'DELETE', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(0).args[1].body, null, 'fetch called with no data');

      assert.equal(fetchStub.getCall(1).args[1].method, 'DELETE', 'fetch called with expected method');
      assert.equal(fetchStub.getCall(1).args[1].body, null, 'fetch called with no data');
    });

    test('#push - source can limit the number of allowed requests per transform with `maxRequestsPerTransform`', async function(assert) {
      assert.expect(1);

      let planet1 = source.requestProcessor.serializer.deserializeResource({ type: 'planet', id: '1' });
      let planet2 = source.requestProcessor.serializer.deserializeResource({ type: 'planet', id: '2' });

      source.maxRequestsPerTransform = 1;

      try {
        await source.push(t => [
          t.removeRecord(planet1),
          t.removeRecord(planet2)
        ]);
      } catch(e) {
        assert.ok(e instanceof TransformNotAllowed, 'TransformNotAllowed thrown');
      }
    });

    test('#push - request can timeout', async function(assert) {
      assert.expect(2);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      // 10ms timeout
      source.defaultFetchSettings.timeout = 10;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, null, 20)); // 20ms delay

      try {
        await source.push(t => t.replaceAttribute(planet, 'classification', 'terrestrial'));
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, 'No fetch response within 10ms.')
      }
    });

    test('#push - allowed timeout can be specified per-request', async function(assert) {
      assert.expect(2);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
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
        .returns(jsonapiResponse(200, null, 20)); // 20ms delay

      try {
        await source.push(t => t.replaceAttribute(planet, 'classification', 'terrestrial'), options);
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, 'No fetch response within 10ms.')
      }
    });

    test('#push - fetch can reject with a NetworkError', async function(assert) {
      assert.expect(2);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(Promise.reject(':('));

      try {
        await source.push(t => t.replaceAttribute(planet, 'classification', 'terrestrial'));
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, ':(')
      }
    });

    test('#push - response can trigger a ClientError', async function(assert) {
      assert.expect(3);

      let planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      });

      let errors = [{
        status: "422",
        title: "Invalid classification specified"
      }];

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(422, { errors }));

      try {
        await source.push(t => t.replaceAttribute(planet, 'classification', 'terrestrial'));
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof ClientError, 'Client error raised');
        assert.equal(e.description, 'Unprocessable Entity');
        assert.deepEqual(e.data, { errors }, 'Error data included');
      }
    });

    test('#pull - record', async function(assert) {
      assert.expect(5);

      const data: Resource = { type: 'planets', id: '12345', attributes: { name: 'Jupiter', classification: 'gas giant' } };

      const planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecord({ type: 'planet', id: planet.id }));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Jupiter']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - request can timeout', async function(assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' } ,
        relationships: { moons: { data: [] } }
      };

      const planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      // 10ms timeout
      source.defaultFetchSettings.timeout = 10;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data }, 20)); // 20ms delay

      try {
        await source.pull(q => q.findRecord({ type: 'planet', id: planet.id }));
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, 'No fetch response within 10ms.')
      }
    });

    test('#pull - allowed timeout can be specified per-request', async function(assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' } ,
        relationships: { moons: { data: [] } }
      };

      const planet = source.requestProcessor.serializer.deserializeResource({
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
        await source.pull(q => q.findRecord({ type: 'planet', id: planet.id }), options)
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, 'No fetch response within 10ms.')
      }
    });

    test('#pull - fetch can reject with a NetworkError', async function(assert) {
      assert.expect(2);

      const planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(Promise.reject(':('));

      try {
        await source.pull(q => q.findRecord({ type: 'planet', id: planet.id }));
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, ':(')
      }
    });

    test('#pull - record with include', async function(assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' } ,
        relationships: { moons: { data: [] } }
      };

      const planet = source.requestProcessor.serializer.deserializeResource({
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

      await source.pull(q => q.findRecord({ type: 'planet', id: planet.id }), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } }
      ];

      fetchStub
        .withArgs('/planets')
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet'));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord', 'updateRecord', 'updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Jupiter', 'Earth', 'Saturn']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with attribute filter', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial', lengthOfDay: 24 } }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('filter[length-of-day]')}=24`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet')
                                   .filter({ attribute: 'lengthOfDay', value: 24 }));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Earth']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with attribute filters', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial', lengthOfDay: 24 } }
      ];

      const value1 = encodeURIComponent('le:24');
      const value2 = encodeURIComponent('ge:24');
      const attribute = encodeURIComponent('filter[length-of-day]');
      const expectedUrl = `/planets?${attribute}=${value1}&${attribute}=${value2}`;

      fetchStub
        .withArgs(expectedUrl)
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet')
                                   .filter({ attribute: 'lengthOfDay', value: 'le:24' }, { attribute: 'lengthOfDay', value: 'ge:24' }));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Earth']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with relatedRecord filter (single value)', async function(assert) {
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

      let transforms = await source.pull(q => q.findRecords('moon')
                                   .filter({ relation: 'planet', record: { id: 'earth', type: 'planets' } }));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Moon']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with relatedRecord filter (multiple values)', async function(assert) {
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
        .withArgs(`/moons?${encodeURIComponent('filter[planet]')}=${encodeURIComponent('earth,mars')}`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('moon')
                                   .filter({ relation: 'planet', record: [{ id: 'earth', type: 'planets' }, { id: 'mars', type: 'planets' }] }));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), [
        'updateRecord',
        'updateRecord',
        'updateRecord'
      ]);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Moon', 'Phobos', 'Deimos']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with relatedRecords filter', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        {
          id: 'mars',
          type: 'planets',
          attributes: { name: 'Mars' },
          relationships: {
            moons: { data: [{ id: 'phobos', type: 'moons' }, { id: 'deimos', type: 'moons' }] }
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('filter[moons]')}=${encodeURIComponent('phobos,deimos')}`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet')
        .filter({
          relation: 'moons',
          records: [{ id: 'phobos', type: 'moons' }, { id: 'deimos', type: 'moons' }],
          op: 'equal'
        }));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Mars']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with sort by an attribute in ascending order', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } },
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } }
      ];

      fetchStub
        .withArgs('/planets?sort=name')
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet').sort('name'));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord', 'updateRecord', 'updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Earth', 'Jupiter', 'Saturn']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with sort by an attribute in descending order', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } }
      ];

      fetchStub
        .withArgs('/planets?sort=-name')
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet').sort('-name'))

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord', 'updateRecord', 'updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Saturn', 'Jupiter', 'Earth']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with sort by multiple fields', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant', lengthOfDay: 9.9 } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant', lengthOfDay: 10.7 } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial', lengthOfDay: 24.0 } }
      ];

      fetchStub
        .withArgs(`/planets?sort=${encodeURIComponent('length-of-day,name')}`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet').sort('lengthOfDay', 'name'))

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord', 'updateRecord', 'updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Jupiter', 'Saturn', 'Earth']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with pagination', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('page[offset]')}=1&${encodeURIComponent('page[limit]')}=10`)
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRecords('planet')
                                               .page({ offset: 1, limit: 10 }));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord', 'updateRecord', 'updateRecord']);
      assert.deepEqual(transforms[0].operations.map((o: UpdateRecordOperation) => o.record.attributes.name), ['Jupiter', 'Earth', 'Saturn']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with include', async function(assert) {
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
        .returns(jsonapiResponse(200, { data: [] }));

      await source.pull(q => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - records with include many relationships', async function(assert) {
      assert.expect(2);

      const options = {
        sources: {
          jsonapi: {
            include: ['moons', 'solar-systems']
          }
        }
      };

      fetchStub
        .withArgs(`/planets?include=${encodeURIComponent('moons,solar-systems')}`)
        .returns(jsonapiResponse(200, { data: [] }));

      await source.pull(q => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - relatedRecord', async function(assert) {
      assert.expect(12);

      const planetRecord: Record = source.requestProcessor.serializer.deserialize({
        data: {
          type: 'planets',
          id: 'jupiter'
        }
      }).data as Record;

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

      let transforms = await source.pull(q => q.findRelatedRecord(planetRecord, 'solarSystem'));

      assert.equal(transforms.length, 1, 'one transform returned');
      const operations = transforms[0].operations as RecordOperation[];

      const planetId = keyMap.keyToId('planet', 'remoteId', 'jupiter');
      const ssId = keyMap.keyToId('solarSystem', 'remoteId', 'ours');

      assert.deepEqual(operations.map(o => o.op), ['updateRecord', 'replaceRelatedRecord']);

      const op1 = operations[0] as UpdateRecordOperation;
      assert.equal(op1.record.type, 'solarSystem');
      assert.equal(op1.record.id, ssId);
      assert.equal(op1.record.attributes.name, 'Our Solar System');

      const op2 = operations[1] as ReplaceRelatedRecordOperation;
      assert.equal(op2.record.type, 'planet');
      assert.equal(op2.record.id, planetId);
      assert.equal(op2.relationship, 'solarSystem');
      assert.equal(op2.relatedRecord.type, 'solarSystem');
      assert.equal(op2.relatedRecord.id, ssId);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - relatedRecords', async function(assert) {
      assert.expect(8);

      let planetRecord: Record = source.requestProcessor.serializer.deserialize({
        data: {
          type: 'planets',
          id: 'jupiter'
        }
      }).data as Record;

      let data = [{
        type: 'moons',
        id: 'io',
        attributes: {
          name: 'Io'
        }
      }];

      fetchStub
        .withArgs('/planets/jupiter/moons')
        .returns(jsonapiResponse(200, { data }));

      let transforms = await source.pull(q => q.findRelatedRecords(planetRecord, 'moons'));

      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['updateRecord', 'replaceRelatedRecords']);

      const op1 = transforms[0].operations[0] as UpdateRecordOperation;
      assert.equal(op1.record.attributes.name, 'Io');

      const op2 = transforms[0].operations[1] as ReplaceRelatedRecordsOperation;
      assert.equal(op2.record.id, planetRecord.id);
      assert.equal(op2.relationship, 'moons');
      assert.deepEqual(op2.relatedRecords.map(r => r.id),  [op1.record.id]);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#pull - relatedRecords with include', async function(assert) {
      assert.expect(2);

      const planetRecord = source.requestProcessor.serializer.deserialize({
        data: {
          type: 'planets',
          id: 'jupiter'
        }
      }).data as RecordIdentity;

      const options = {
        sources: {
          jsonapi: {
            include: ['planet']
          }
        }
      };

      fetchStub
        .withArgs('/planets/jupiter/moons?include=planet')
        .returns(jsonapiResponse(200, { data: [] }));

      await source.pull(q => q.findRelatedRecords(planetRecord, 'moons'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - record', async function(assert) {
      assert.expect(4);

      const data: Resource = { type: 'planets', id: '12345', attributes: { name: 'Jupiter', classification: 'gas giant' } };

      const planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data }));

      let record = await source.query(q => q.findRecord({ type: 'planet', id: planet.id }));

      assert.ok(!Array.isArray(record), 'only a single primary recored returned');
      assert.equal((record as Record).attributes.name, 'Jupiter');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - invokes preprocessResponseDocument when response has content', async function(assert) {
      assert.expect(1);

      const data: Resource = { type: 'planets', id: '12345', attributes: { name: 'Jupiter', classification: 'gas giant' } };
      const meta = {
        'important-info': 'goes-here'
      };
      let responseDoc = { data, meta };

      const planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, responseDoc));

      const preprocessResponseDocumentSpy = sinon.spy(source.requestProcessor, 'preprocessResponseDocument');

      await source.query(q => q.findRecord({ type: 'planet', id: planet.id }));

      assert.ok(preprocessResponseDocumentSpy.calledOnceWith(responseDoc, sinon.match.any));
      preprocessResponseDocumentSpy.restore();
    });

    test('#query - request can timeout', async function(assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' } ,
        relationships: { moons: { data: [] } }
      };

      const planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      // 10ms timeout
      source.defaultFetchSettings.timeout = 10;

      fetchStub
        .withArgs('/planets/12345')
        .returns(jsonapiResponse(200, { data }, 20)); // 20ms delay

      try {
        await source.query(q => q.findRecord({ type: 'planet', id: planet.id }));
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, 'No fetch response within 10ms.')
      }
    });

    test('#query - allowed timeout can be specified per-request', async function(assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' } ,
        relationships: { moons: { data: [] } }
      };

      const planet = source.requestProcessor.serializer.deserializeResource({
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
        await source.query(q => q.findRecord({ type: 'planet', id: planet.id }), options);
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, 'No fetch response within 10ms.')
      }
    });

    test('#query - fetch can reject with a NetworkError', async function(assert) {
      assert.expect(2);

      const planet = source.requestProcessor.serializer.deserializeResource({
        type: 'planet',
        id: '12345'
      });

      fetchStub
        .withArgs('/planets/12345')
        .returns(Promise.reject(':('));

      try {
        await source.query(q => q.findRecord({ type: 'planet', id: planet.id }));
        assert.ok(false, 'should not be reached');
      } catch(e) {
        assert.ok(e instanceof NetworkError, 'Network error raised');
        assert.equal(e.description, ':(')
      }
    });

    test('#query - record with include', async function(assert) {
      assert.expect(2);

      const data: Resource = {
        type: 'planets',
        id: '12345',
        attributes: { name: 'Jupiter', classification: 'gas giant' } ,
        relationships: { moons: { data: [] } }
      };

      const planet = source.requestProcessor.serializer.deserializeResource({
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

      await source.query(q => q.findRecord({ type: 'planet', id: planet.id }), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } }
      ];

      fetchStub
        .withArgs('/planets')
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('planet'));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Jupiter', 'Earth', 'Saturn']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with attribute filter', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial', lengthOfDay: 24 } }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('filter[length-of-day]')}=24`)
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('planet')
                                          .filter({ attribute: 'lengthOfDay', value: 24 }));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Earth']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with relatedRecord filter (single value)', async function(assert) {
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

      let records: Record[] = await source.query(q => q.findRecords('moon')
                                          .filter({ relation: 'planet', record: { id: 'earth', type: 'planets' } }));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Moon']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with relatedRecord filter (multiple values)', async function(assert) {
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
        .withArgs(`/moons?${encodeURIComponent('filter[planet]')}=${encodeURIComponent('earth,mars')}`)
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('moon')
                                          .filter({ relation: 'planet', record: [{ id: 'earth', type: 'planets' }, { id: 'mars', type: 'planets' }] }))

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Moon', 'Phobos', 'Deimos']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with relatedRecords filter', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        {
          id: 'mars',
          type: 'planets',
          attributes: { name: 'Mars' },
          relationships: {
            moons: { data: [{ id: 'phobos', type: 'moons' }, { id: 'deimos', type: 'moons' }] }
          }
        }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('filter[moons]')}=${encodeURIComponent('phobos,deimos')}`)
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('planet')
        .filter({
          relation: 'moons',
          records: [{ id: 'phobos', type: 'moons' }, { id: 'deimos', type: 'moons' }],
          op: 'equal'
        }));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Mars']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with sort by an attribute in ascending order', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } },
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } }
      ];

      fetchStub
        .withArgs('/planets?sort=name')
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('planet').sort('name'));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Earth', 'Jupiter', 'Saturn']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with sort by an attribute in descending order', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } }
      ];

      fetchStub
        .withArgs('/planets?sort=-name')
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('planet').sort('-name'));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Saturn', 'Jupiter', 'Earth']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with sort by multiple fields', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant', lengthOfDay: 9.9 } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant', lengthOfDay: 10.7 } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial', lengthOfDay: 24.0 } }
      ];

      fetchStub
        .withArgs(`/planets?sort=${encodeURIComponent('length-of-day,name')}`)
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('planet').sort('lengthOfDay', 'name'));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Jupiter', 'Saturn', 'Earth']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with pagination', async function(assert) {
      assert.expect(5);

      const data: Resource[] = [
        { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
        { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } },
        { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } }
      ];

      fetchStub
        .withArgs(`/planets?${encodeURIComponent('page[offset]')}=1&${encodeURIComponent('page[limit]')}=10`)
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRecords('planet')
                                                       .page({ offset: 1, limit: 10 }));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 3, 'three objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Jupiter', 'Earth', 'Saturn']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with include', async function(assert) {
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
        .returns(jsonapiResponse(200, { data: [] }));

      await source.query(q => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with include: verify only primary data array is returned', async function(assert) {
      assert.expect(6);

      const options = {
        sources: {
          jsonapi: {
            include: ['moons']
          }
        }
      };

      fetchStub
        .withArgs('/planets?include=moons')
        .returns(jsonapiResponse(200, {
          data: [{ type: 'planets', id: '1' }, { type: 'planets', id: '2' }],
          included: [{ type: 'moons', id: '1' }, { type: 'moons', id: '2' }]
        }));

      let records: Record[] = await source.query(q => q.findRecords('planet'), options);

      assert.ok(Array.isArray(records), 'query result is an array, like primary data');
      assert.equal(records.length, 2, 'query result length equals primary data length');
      assert.deepEqual(records.map(planet => planet.type), ['planet', 'planet']);
      assert.deepEqual(records.map(planet => planet.keys.remoteId), ['1', '2'], 'returned IDs match primary data (including sorting)');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records with include many relationships', async function(assert) {
      assert.expect(2);

      const options = {
        sources: {
          jsonapi: {
            include: ['moons', 'solar-systems']
          }
        }
      };

      fetchStub
        .withArgs(`/planets?include=${encodeURIComponent('moons,solar-systems')}`)
        .returns(jsonapiResponse(200, { data: [] }));

      await source.query(q => q.findRecords('planet'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - records invokes preprocessResponseDocument when response has content', async function(assert) {
      assert.expect(1);
      const responseDoc : ResourceDocument = { meta: { 'interesting': 'info' }, data: [] };
      fetchStub
        .withArgs(`/planets`)
        .returns(jsonapiResponse(200, responseDoc));
        const preprocessResponseDocumentSpy = sinon.spy(source.requestProcessor, 'preprocessResponseDocument');

      await source.query(q => q.findRecords('planet'), {});

      assert.ok(preprocessResponseDocumentSpy.calledOnceWith(responseDoc, sinon.match.any));
      preprocessResponseDocumentSpy.restore();
    });

    test('#query - relatedRecords', async function(assert) {
      assert.expect(5);

      let planetRecord: Record = source.requestProcessor.serializer.deserialize({
        data: {
          type: 'planets',
          id: 'jupiter'
        }
      }).data as Record;

      let data = [{
        type: 'moons',
        id: 'io',
        attributes: {
          name: 'Io'
        }
      }];

      fetchStub
        .withArgs('/planets/jupiter/moons')
        .returns(jsonapiResponse(200, { data }));

      let records: Record[] = await source.query(q => q.findRelatedRecords(planetRecord, 'moons'));

      assert.ok(Array.isArray(records), 'returned an array of data');
      assert.equal(records.length, 1, 'one objects in data returned');
      assert.deepEqual(records.map((o) => o.attributes.name), ['Io']);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });

    test('#query - relatedRecords with include', async function(assert) {
      assert.expect(2);

      const planetRecord = source.requestProcessor.serializer.deserialize({
        data: {
          type: 'planets',
          id: 'jupiter'
        }
      }).data as RecordIdentity;

      const options = {
        sources: {
          jsonapi: {
            include: ['planet']
          }
        }
      };

      fetchStub
        .withArgs('/planets/jupiter/moons?include=planet')
        .returns(jsonapiResponse(200, { data: [] }));

      await source.query(q => q.findRelatedRecords(planetRecord, 'moons'), options);

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');
    });
  });

  module('with no secondary keys', function(hooks) {
    hooks.beforeEach(function() {
      fetchStub = sinon.stub(self, 'fetch');

      let schema = new Schema({
        models: {
          planet: {
            attributes: {
              name: { type: 'string' },
              classification: { type: 'string' }
            },
            relationships: {
              moons: { type: 'hasMany', model: 'moon', inverse: 'planet' }
            }
          },
          moon: {
            attributes: {
              name: { type: 'string' }
            },
            relationships: {
              planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
            }
          }
        }
      });

      source = new JSONAPISource({ schema });
    });

    hooks.afterEach(function() {
      schema = source = null;
      fetchStub.restore();
    });

    test('#push - can add records', async function(assert) {
      assert.expect(5);

      let transformCount = 0;

      let planet = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      let addPlanetOp = {
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

      source.on('transform', (transform: Transform) => {
        transformCount++;

        if (transformCount === 1) {
          assert.deepEqual(
            transform.operations,
            [addPlanetOp],
            'transform event initially returns add-record op'
          );
        }
      });

      fetchStub
        .withArgs('/planets')
        .returns(jsonapiResponse(201, {
          data: { id: planet.id, type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
        }));

      await source.push(t => t.addRecord(planet));

      assert.ok(true, 'transform resolves successfully');

      assert.equal(fetchStub.callCount, 1, 'fetch called once');
      assert.equal(fetchStub.getCall(0).args[1].method, 'POST', 'fetch called with expected method');
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
  });
});
