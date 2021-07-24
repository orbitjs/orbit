import { InitializedRecord, RecordSchema } from '@orbit/records';
import { JSONAPISource, JSONAPIResponse } from '@orbit/jsonapi';
import { MemorySource } from '@orbit/memory';
import { Coordinator, RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { jsonapiResponse } from './support/jsonapi';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { FullResponse } from '@orbit/data';

const { module, test } = QUnit;

module(
  'Store + JSONAPISource + client-generated IDs + pessimistic coordination',
  function (hooks) {
    let fetchStub: SinonStub;
    let schema: RecordSchema;
    let remote: JSONAPISource;
    let memory: MemorySource;
    let coordinator: Coordinator;

    hooks.beforeEach(async () => {
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
    });

    hooks.afterEach(() => {
      fetchStub.restore();
    });

    module('passHints: true', function (hooks) {
      hooks.beforeEach(() => {
        // Query the remote server whenever the memory source is queried
        coordinator.addStrategy(
          new RequestStrategy({
            source: 'memory',
            on: 'beforeQuery',
            target: 'remote',
            action: 'query',
            blocking: true,
            passHints: true
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

      test('Adding a record to the memory source immediately pushes the update to the remote', async function (assert) {
        assert.expect(2);

        await coordinator.activate();

        let planet = {
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

        const createdRecord = await memory.update((t) => t.addRecord(planet));
        const result = memory.cache.query((q) => q.findRecord(planet));

        assert.deepEqual(result, {
          type: 'planet',
          id: planet.id,
          attributes: { name: 'Jupiter', classification: 'gas giant' }
        });

        assert.strictEqual(createdRecord, result);
      });

      test('Hints affect both the `data` and `details` returned in a full response', async function (assert) {
        assert.expect(6);

        await coordinator.activate();

        const planet1 = {
          type: 'planet',
          id: '1',
          attributes: { name: 'Jupiter' }
        };

        const planet2 = {
          type: 'planet',
          id: '2',
          attributes: { name: 'Earth' }
        };

        fetchStub
          .withArgs('/planets/1')
          .returns(jsonapiResponse(200, { data: planet1 }));
        fetchStub
          .withArgs('/planets/2')
          .returns(jsonapiResponse(200, { data: planet2 }));

        let { data: records, details, sources } = (await memory.query(
          (q) => [
            q.findRecord({ type: 'planet', id: planet1.id }),
            q.findRecord({ type: 'planet', id: planet2.id })
          ],
          { fullResponse: true }
        )) as FullResponse<InitializedRecord[], JSONAPIResponse[]>;

        assert.ok(Array.isArray(records), 'multiple primary records returned');
        assert.equal(records?.[0].attributes?.name, 'Jupiter');
        assert.equal(records?.[1].attributes?.name, 'Earth');

        assert.equal(details?.[0].response.status, 200);
        assert.equal(details?.[1].response.status, 200);
        assert.strictEqual(sources?.remote.details, details);
      });
    });

    module('passHints: false', function (hooks) {
      hooks.beforeEach(() => {
        // Query the remote server whenever the memory source is queried
        coordinator.addStrategy(
          new RequestStrategy({
            source: 'memory',
            on: 'beforeQuery',
            target: 'remote',
            action: 'query',
            blocking: true,
            passHints: false
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
            passHints: false
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

      test('Adding a record to the memory source immediately pushes the update to the remote', async function (assert) {
        assert.expect(2);

        await coordinator.activate();

        let planet = {
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

        const updateResult = await memory.update((t) => t.addRecord(planet));
        const queryResult = memory.cache.query((q) => q.findRecord(planet));

        assert.strictEqual(
          updateResult,
          undefined,
          'update returns undefined, because the transform was already applied via sync'
        );

        assert.deepEqual(
          queryResult,
          {
            type: 'planet',
            id: planet.id,
            attributes: { name: 'Jupiter', classification: 'gas giant' }
          },
          'query returns record'
        );
      });

      test('Adding an array of records to the memory source immediately pushes the update to the remote', async function (assert) {
        assert.expect(1);

        await coordinator.activate();

        let planet = {
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

        const updateResult = await memory.update((t) => [t.addRecord(planet)]);

        assert.strictEqual(
          updateResult,
          undefined,
          'update returns undefined, because the transform was already applied via sync'
        );
      });

      test('Hints affect both the `data` and `details` returned in a full response', async function (assert) {
        assert.expect(4);

        await coordinator.activate();

        const planet1 = {
          type: 'planet',
          id: '1',
          attributes: { name: 'Jupiter' }
        };

        const planet2 = {
          type: 'planet',
          id: '2',
          attributes: { name: 'Earth' }
        };

        fetchStub
          .withArgs('/planets/1')
          .returns(jsonapiResponse(200, { data: planet1 }));
        fetchStub
          .withArgs('/planets/2')
          .returns(jsonapiResponse(200, { data: planet2 }));

        let { data: records, details, sources } = (await memory.query(
          (q) => [
            q.findRecord({ type: 'planet', id: planet1.id }),
            q.findRecord({ type: 'planet', id: planet2.id })
          ],
          { fullResponse: true }
        )) as FullResponse<InitializedRecord[], JSONAPIResponse[]>;

        assert.ok(Array.isArray(records), 'multiple primary records returned');
        assert.equal(
          records?.[0].attributes?.name,
          'Jupiter',
          'first record matches'
        );
        assert.equal(
          records?.[1].attributes?.name,
          'Earth',
          'second record matches'
        );

        assert.equal(details, undefined, 'no details returned');
      });
    });
  }
);
