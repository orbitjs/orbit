import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import Store from 'orbit-common/store';
import { Promise } from 'rsvp';

const schemaDefinition = {
  models: {
    planet: {}
  }
};

let store,
    source;

///////////////////////////////////////////////////////////////////////////////

module('Integration - MemorySource Sync without Connector', {
  setup: function() {
    Orbit.Promise = Promise;

    // Create schema
    let schema = new Schema(schemaDefinition);

    // Create sources
    store = new Store({ schema: schema });
    source = new MemorySource({ schema: schema });

    store.coordinator.on('transform', transform => source.transform(transform));
  },

  teardown: function() {
    store = source = null;
  }
});

test('records inserted into the store should be automatically copied to the backup source', function({ async }) {
  let done = async();
  expect(6);

  store.addRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } })
    .then((originalRecord) => {
      let primaryPlanet = store.cache.get(['planet', 'jupiter']);
      let backupPlanet = source.cache.get(['planet', 'jupiter']);

      ok(primaryPlanet, 'store should contain the record');
      ok(backupPlanet, 'backup source should contain the record');
      notStrictEqual(backupPlanet, originalRecord, 'not the same object as the one originally inserted');

      equal(backupPlanet.id, originalRecord.id, 'backup record has the same primary id');
      equal(backupPlanet.attributes.name, originalRecord.attributes.name, 'backup record has the same name');
      equal(backupPlanet.attributes.classification, originalRecord.attributes.classification, 'backup record has the same classification');

      done();
    });
});

test('replaced records in the store should be automatically copied to the backup source', function({ async }) {
  let done = async();
  expect(7);

  store.addRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } })
    .then((originalPlanet) => {
      store.replaceRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Earth', classification: 'terrestrial' } })
        .then(() => {
          let updatedPlanet = store.cache.get(['planet', 'jupiter']);
          equal(updatedPlanet.id, originalPlanet.id, 'primary id remains the same');
          equal(updatedPlanet.attributes.name, 'Earth', 'name has been updated');
          equal(updatedPlanet.attributes.classification, 'terrestrial', 'classification has been updated');

          let backupPlanet = source.cache.get(['planet', 'jupiter']);
          notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
          equal(backupPlanet.id, originalPlanet.id, 'backup record has the same primary id');
          equal(backupPlanet.attributes.name, 'Earth', 'backup record has updated name');
          equal(backupPlanet.attributes.classification, 'terrestrial', 'backup record has updated classification');

          done();
        });
    });
});

test('updates to record attributes in the store should be automatically copied to the backup source', function({ async }) {
  let done = async();
  expect(5);

  store.addRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } })
    .then((originalPlanet) => {
      store.replaceAttribute(originalPlanet, 'classification', 'terrestrial')
        .then(() => {
          let updatedPlanet = store.cache.get(['planet', 'jupiter']);
          equal(updatedPlanet.id, originalPlanet.id, 'primary id remains the same');
          equal(updatedPlanet.attributes.classification, 'terrestrial', 'classification has been updated');

          let backupPlanet = source.cache.get(['planet', 'jupiter']);
          notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
          equal(backupPlanet.id, originalPlanet.id, 'backup record has the same primary id');
          equal(backupPlanet.attributes.classification, 'terrestrial', 'backup record has updated classification');

          done();
        });
    });
});

test('records deleted in the store should be automatically deleted in the backup source', function({ async }) {
  let done = async();
  expect(2);

  store.addRecord({ id: 'jupiter', type: 'planet' })
    .then((planet) => {
      return store.removeRecord(planet);
    })
    .then(() => {
      ok(!store.cache.get(['planet', 'jupiter'], 'record has been deleted from store'));
      ok(!source.cache.get(['planet', 'jupiter'], 'record has been deleted from backup source'));

      done();
    });
});
