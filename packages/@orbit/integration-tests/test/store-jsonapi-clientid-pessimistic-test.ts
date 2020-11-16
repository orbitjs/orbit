import { Record, RecordSchema } from '@orbit/records';
import { JSONAPISource } from '@orbit/jsonapi';
import { MemorySource } from '@orbit/memory';
import { Coordinator, RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { jsonapiResponse } from './support/jsonapi';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';

const { module, test } = QUnit;

module(
  'Store + JSONAPISource + client-generated IDs + pessimistic coordination',
  function (hooks) {
    let fetchStub: SinonStub;
    let schema: RecordSchema;
    let remote: JSONAPISource;
    let memory: MemorySource;
    let coordinator: Coordinator;

    hooks.beforeEach(() => {
      fetchStub = sinon.stub(self, 'fetch');

      schema = new RecordSchema({
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
              }
            }
          }
        }
      });

      memory = new MemorySource({ schema });

      remote = new JSONAPISource({ schema, name: 'remote' });

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
          blocking: true
        })
      );

      // Update the remote server whenever the memory source is updated
      coordinator.addStrategy(
        new RequestStrategy({
          source: 'memory',
          on: 'beforeUpdate',
          target: 'remote',
          action: 'update',
          blocking: true,
          passHints: true
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

    test('Adding a record to the memory source immediately pushes the update to the remote', async function (assert) {
      assert.expect(2);

      await coordinator.activate();

      let planet: Record = {
        type: 'planet',
        id: schema.generateId(),
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      };

      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            id: planet.id,
            type: 'planet',
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          }
        })
      );

      let createdRecord = await memory.update((t) => t.addRecord(planet));
      let result = memory.cache.query((q) => q.findRecord(planet)) as Record;

      assert.deepEqual(result, {
        type: 'planet',
        id: planet.id,
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      });

      assert.deepEqual(createdRecord, result);
    });
  }
);
