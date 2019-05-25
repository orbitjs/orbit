
import { Schema } from '@orbit/data'

import Store from "@orbit/store"
import { jsonapiResponse } from './support/jsonapi';
import IndexedDBSource from '@orbit/indexeddb'
import Coordinator, { SyncStrategy, RequestStrategy, LogLevel } from '@orbit/coordinator'

const { module, test } = QUnit;
import JSONAPISource from '@orbit/jsonapi'
import { SinonStatic, SinonStub } from 'sinon';

declare const sinon: SinonStatic;
//  bucket
import LocalStorageBucket from '@orbit/local-storage-bucket'
import IndexedDBBucket, { supportsIndexedDB } from '@orbit/indexeddb-bucket'
import { NetworkError, Transform } from '@orbit/data';
module('JSONAPI', function (hooks) {
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
                        atmosphere: { type: 'boolean' },
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

        //keyMap = new KeyMap();

        store = new Store({ schema });

        remote = new JSONAPISource({ schema, name: 'remote' });
        //remote.serializer.resourceKey = function () { return 'remoteId'; };

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
            blocking: false
        }));

        // Sync all changes received from the remote server to the store
        coordinator.addStrategy(new SyncStrategy({
            source: 'remote',
            target: 'store',
            blocking: true
        }));

        coordinator.activate()
    });

    hooks.afterEach(() => {
        schema = remote = store = coordinator = null;

        fetchStub.restore();
    });
    test('double query', async function (assert) {
        assert.expect(1)
        fetchStub.withArgs('/planets/earth').returns(jsonapiResponse(200, {
            data: {
                type: "planets",
                id: "earth",
                attributes: {
                    name: "Earth",
                    classification: "terrestrial",
                    atmosphere: true,
                    lengthOfDay: 24
                }
            }
        }))
        fetchStub.withArgs('/planets').callsFake(() => jsonapiResponse(200, {
            data: [
                {
                    type: "planets",
                    id: "earth",
                    attributes: {
                        name: "Earth",
                        classification: "terrestrial",
                        atmosphere: true,
                        lengthOfDay: 24
                    }
                },
                {
                    type: "planets",
                    id: "venus",
                    attributes: {
                        name: "Venus",
                        classification: "terrestrial",
                        atmosphere: true,
                        lengthOfDay: 10
                    }
                }
            ]
        }))
        //console.log(fetchStub)
        let data = await store.query((q) => q.findRecords('planet'))
        console.log(data)
        let data2 = await store.cache.query((q) => q.findRecords('planet'))
        console.log(data2)

        let data3 = await store.query((q) => q.findRecord(data[0]))
        console.log(data3)
        let datanew = await store.query((q) => q.findRecords('planet'))
        console.log(datanew)
        let last = await store.query((q) => q.findRecord(data[0]))
        console.log(last)
        assert.deepEqual(data, data2)
    })
})
