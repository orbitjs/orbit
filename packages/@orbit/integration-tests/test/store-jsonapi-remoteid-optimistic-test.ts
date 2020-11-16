import { RecordKeyMap, Record, RecordSchema } from '@orbit/records';
import { JSONAPISource } from '@orbit/jsonapi';
import { MemorySource } from '@orbit/memory';
import { Coordinator, RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { jsonapiResponse } from './support/jsonapi';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';

const { module, test } = QUnit;

module(
  'Store + JSONAPISource + remote IDs + optimistic coordination',
  function (hooks) {
    let fetchStub: SinonStub;
    let keyMap: RecordKeyMap;
    let schema: RecordSchema;
    let remote: JSONAPISource;
    let memory: MemorySource;
    let coordinator: Coordinator;

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
              }
            }
          }
        }
      });

      keyMap = new RecordKeyMap();

      memory = new MemorySource({ schema, keyMap });

      remote = new JSONAPISource({
        schema,
        keyMap,
        name: 'remote'
      });

      coordinator = new Coordinator({
        sources: [memory, remote]
      });

      // Query the remote server whenever the memory source is queried
      coordinator.addStrategy(
        new RequestStrategy({
          source: 'memory',
          on: 'beforeQuery',
          target: 'remote',
          action: 'pull',
          blocking: false
        })
      );

      // Update the remote server whenever the memory source is updated
      coordinator.addStrategy(
        new RequestStrategy({
          source: 'memory',
          on: 'beforeUpdate',
          target: 'remote',
          action: 'push',
          blocking: false
        })
      );

      // Sync all changes received from the remote server to the memory source
      coordinator.addStrategy(
        new SyncStrategy({
          source: 'remote',
          target: 'memory',
          blocking: true
        })
      );
    });

    hooks.afterEach(() => {
      fetchStub.restore();
    });

    test('Adding a record to the memory source queues an update request which will be pushed to the remote', async function (assert) {
      assert.expect(3);

      await coordinator.activate();

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: '12345',
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      let planet: Record = {
        type: 'planet',
        id: schema.generateId(),
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      let createdRecord = (await memory.update((t) =>
        t.addRecord(planet)
      )) as Record;
      let result = memory.cache.query((q) => q.findRecord(planet));

      assert.deepEqual(
        result,
        {
          type: 'planet',
          id: planet.id,
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        'keys have not been syncd up yet - remote source still needs to process request'
      );
      assert.deepEqual(createdRecord, result);

      await remote.requestQueue.process();

      assert.deepEqual(
        memory.cache.query((q) => q.findRecord(planet)),
        {
          type: 'planet',
          id: planet.id,
          keys: { remoteId: '12345' },
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        },
        'keys are syncd up after remote source finishes processing requests'
      );
    });
  }
);
