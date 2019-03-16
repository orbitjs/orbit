import {
  Record,
  Schema
} from '@orbit/data';
import JSONAPISource from '@orbit/jsonapi';
import Store from '@orbit/store';
import Coordinator, { RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { jsonapiResponse } from './support/jsonapi';
import { SinonStatic, SinonStub} from 'sinon';

declare const sinon: SinonStatic;
const { module, test } = QUnit;

module('Store + JSONAPISource + client-generated IDs + pessimistic coordination', function(hooks) {
  let fetchStub: SinonStub;
  let schema: Schema;
  let remote: JSONAPISource;
  let store: Store;
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
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
          }
        },
        solarSystem: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planets: { type: 'hasMany', model: 'planet', inverse: 'solarSystem' }
          }
        }
      }
    });

    store = new Store({ schema });

    remote = new JSONAPISource({ schema, name: 'remote' });

    coordinator = new Coordinator({
      sources: [store, remote]
    });

    // Query the remote server whenever the store is queried
    coordinator.addStrategy(new RequestStrategy({
      source: 'store',
      on: 'beforeQuery',
      target: 'remote',
      action: 'pull',
      blocking: true
    }));

    // Update the remote server whenever the store is updated
    coordinator.addStrategy(new RequestStrategy({
      source: 'store',
      on: 'beforeUpdate',
      target: 'remote',
      action: 'push',
      blocking: true
    }));

    // Sync all changes received from the remote server to the store
    coordinator.addStrategy(new SyncStrategy({
      source: 'remote',
      target: 'store',
      blocking: true
    }));
  });

  hooks.afterEach(() => {
    schema = remote = store = coordinator = null;

    fetchStub.restore();
  });

  test('Adding a record to the store immediately pushes the update to the remote', async function(assert) {
    assert.expect(1);

    await coordinator.activate();

    let planet: Record = { type: 'planet', id: schema.generateId(), attributes: { name: 'Jupiter', classification: 'gas giant' } };

    fetchStub
      .withArgs('/planets')
      .returns(jsonapiResponse(201, {
        data: { id: planet.id, type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
      }));

    await store.update(t => t.addRecord(planet));

    let result = store.cache.query(q => q.findRecord(planet));

    assert.deepEqual(result, {
      type: 'planet',
      id: planet.id,
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    });
  });
});
