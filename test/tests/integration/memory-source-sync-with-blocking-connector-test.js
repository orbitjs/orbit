import 'tests/test-helper';
import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import Store from 'orbit-common/store';
import TransformConnector from 'orbit/transform-connector';
import { Promise, all } from 'rsvp';

const schemaDefinition = {
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
        planet: { type: 'hasOne', model: 'planet', inverse: 'moons' },
        mountains: { type: 'hasMany', model: 'mountain', inverse: 'moon' }
      }
    },
    friend: {
      relationships: {
        group: { model: 'group', type: 'hasOne', inverse: 'members' }
      }
    },
    group: {
      relationships: {
        members: { model: 'friend', type: 'hasMany', inverse: 'group' }
      }
    }
  }
};

let schema,
    store,
    source,
    storeToSourceConnector,
    sourceToStoreConnector;

module('Integration - Memory Source Sync (Blocking)', {
  setup: function() {
    // Create schema
    schema = new Schema(schemaDefinition);

    // Create sources
    store = new Store({ schema: schema });
    source = new MemorySource({ schema: schema });

    store.id = 'store';
    source.id = 'source';

    // Create connectors
    storeToSourceConnector = new TransformConnector(store.coordinator, source);
    sourceToStoreConnector = new TransformConnector(source, store.coordinator);
  },

  teardown: function() {
    storeToSourceConnector = null;
    sourceToStoreConnector = null;
    store = null;
    source = null;
  }
});

test('consecutive transforms can be applied to one source and should be automatically applied to the other source', function({ async }) {
  let done = async();
  expect(4);

  store.addRecord({ id: '123', type: 'planet', attributes: { name: 'Jupiter' } })
    .then(function(jupiter) {
      return store.replaceAttribute(jupiter, 'name', 'Earth');
    })
    .then(function() {
      let storeVersion = store.cache.get(['planet', '123']);
      let sourceVersion = source.cache.get(['planet', '123']);

      notStrictEqual(sourceVersion, storeVersion, 'not the same object as the one originally inserted');
      equal(sourceVersion.id, storeVersion.id, 'backup record has the same primary id');
      equal(sourceVersion.attributes.name, storeVersion.attributes.name, 'backup record has the same name');
      equal(sourceVersion.attributes.name, 'Earth', 'records have the updated name');

      done();
    });
});

test('replacing value with null should not cause infinite update loop', function({ async }) {
  let done = async();
  expect(4);

  store.addRecord({ type: 'planet', id: '123', attributes: { name: 'Jupiter' } })
    .then(function(jupiter) {
      return store.replaceAttribute(jupiter, 'name', null);
    })
    .then(function() {
      let storeVersion = store.cache.get(['planet', '123']);
      let sourceVersion = source.cache.get(['planet', '123']);

      notStrictEqual(sourceVersion, storeVersion, 'not the same object as the one originally inserted');
      strictEqual(sourceVersion.id, storeVersion.id, 'backup record has the same primary id');
      strictEqual(sourceVersion.attributes.name, storeVersion.attributes.name, 'backup record has the same name');
      strictEqual(sourceVersion.attributes.name, null, 'records have name == null');

      done();
    });
});

test('replacing relationship should not cause infinite update loop', function({ async }) {
  let done = async();
  expect(12);

  function retrieveHasMany(record, relationship) {
    return Object.keys(record.relationships[relationship].data || {});
  }

  all([
    store.addRecord({ type: 'friend', id: 'gnarf' }),
    store.addRecord({ type: 'group', id: 'initial' }),
    store.addRecord({ type: 'group', id: 'new' })
  ])
  .spread(function(storeGnarf, storeInitialGroup, storeNewGroup) {
    let sourceGnarf = source.cache.get(['friend', 'gnarf']);
    let sourceInitialGroup = source.cache.get(['group', 'initial']);
    let sourceNewGroup = source.cache.get(['group', 'new']);

    store.replaceHasOne(storeGnarf, 'group', storeInitialGroup)
      .then(function() {
        equal(storeGnarf.relationships.group.data, 'group:initial', 'initial group check');
        equal(sourceGnarf.relationships.group.data, 'group:initial', 'initial group check');

        equal(retrieveHasMany(storeInitialGroup, 'members').length, 1, 'initial group check');
        equal(retrieveHasMany(sourceInitialGroup, 'members').length, 1, 'initial group check');

        equal(retrieveHasMany(storeNewGroup, 'members').length, 0, 'new group check');
        equal(retrieveHasMany(sourceNewGroup, 'members').length, 0, 'new group check');
      })
      .then(function() {
        return store.replaceHasOne(storeGnarf, 'group', storeNewGroup);
      })
      .then(function() {
        equal(storeGnarf.relationships.group.data, 'group:new', 'new group check');
        equal(sourceGnarf.relationships.group.data, 'group:new', 'new group check');

        equal(retrieveHasMany(storeInitialGroup, 'members').length, 0, 'initial group check');
        equal(retrieveHasMany(sourceInitialGroup, 'members').length, 0, 'initial group check');

        equal(retrieveHasMany(storeNewGroup, 'members').length, 1, 'new group check');
        equal(retrieveHasMany(sourceNewGroup, 'members').length, 1, 'new group check');
      })
      .then(function() {
        done();
      });
  });
});
