import {
  KeyMap,
  Record,
  Schema
} from '@orbit/data';
import JSONAPISource from '@orbit/jsonapi';
import MemorySource from '@orbit/memory';
import Coordinator, { RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { jsonapiResponse } from './support/jsonapi';
import { SinonStatic, SinonStub} from 'sinon';

declare const sinon: SinonStatic;
const { module, test } = QUnit;

module('Store + JSONAPISource + remote IDs + optimistic coordination', function(hooks) {
  let fetchStub: SinonStub;
  let keyMap: KeyMap;
  let schema: Schema;
  let remote: JSONAPISource;
  let memory: MemorySource;
  let coordinator: Coordinator;

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

    memory = new MemorySource({ schema, keyMap });

    remote = new JSONAPISource({ schema, keyMap, name: 'remote' });
    remote.requestProcessor.serializer.resourceKey = function() { return 'remoteId'; };

    coordinator = new Coordinator({
      sources: [memory, remote]
    });

    // Query the remote server whenever the memory source is queried
    coordinator.addStrategy(new RequestStrategy({
      source: 'memory',
      on: 'beforeQuery',
      target: 'remote',
      action: 'pull',
      blocking: false
    }));

    // Update the remote server whenever the memory source is updated
    coordinator.addStrategy(new RequestStrategy({
      source: 'memory',
      on: 'beforeUpdate',
      target: 'remote',
      action: 'push',
      blocking: false
    }));

    // Sync all changes received from the remote server to the memory source
    coordinator.addStrategy(new SyncStrategy({
      source: 'remote',
      target: 'memory',
      blocking: true
    }));
  });

  hooks.afterEach(() => {
    keyMap = schema = remote = memory = coordinator = null;

    fetchStub.restore();
  });

  test('Adding a record to the memory source queues an update request which will be pushed to the remote', async function(assert) {
    assert.expect(2);

    await coordinator.activate();

    fetchStub
      .withArgs('/planets')
      .returns(jsonapiResponse(201, {
        data: { id: '12345', type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
      }));

    let planet: Record = { type: 'planet', id: schema.generateId(), attributes: { name: 'Jupiter', classification: 'gas giant' } };
    await memory.update(t => t.addRecord(planet));

    assert.deepEqual(
      memory.cache.query(q => q.findRecord(planet)),
      {
        type: 'planet',
        id: planet.id,
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      },
      'keys have not been syncd up yet - remote source still needs to process request'
    );

    await remote.requestQueue.process();

    assert.deepEqual(
      memory.cache.query(q => q.findRecord(planet)),
      {
        type: 'planet',
        id: planet.id,
        keys: { remoteId: '12345' },
        attributes: { name: 'Jupiter', classification: 'gas giant' }
      },
      'keys are syncd up after remote source finishes processing requests'
    );
  });
});
