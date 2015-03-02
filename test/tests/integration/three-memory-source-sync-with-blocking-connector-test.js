import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';

/**
 This test suite connects three memory sources with synchronous blocking
 bi-directional transform connectors.

 This configuration should not be used when more than one source can
 spontaneously mutate, out of the context of responding to another source's
 mutations. For example, socket sources receive data spontaneously. Having
 more than one in this configuration could create a deadlock in a central
 source that is receiving data from both and sending it on to the other.
 In such a scenario, it would be preferable to use non-blocking connectors to
 prevent deadlocks.
 */
var source1,
    source2,
    source3,
    source1to2Connector,
    source2to1Connector,
    source1to3Connector,
    source3to1Connector;

module("Integration - Three Memory Source Sync (Blocking)", {
  setup: function() {
    Orbit.Promise = Promise;

    // Create schema
    var schema = new Schema({
      modelDefaults: {
        keys: {
          '__id': {primaryKey: true, defaultValue: uuid},
          'id': {}
        }
      },
      models: {
        planet: {
          attributes: {
            name: {type: 'string'},
            classification: {type: 'string'}
          }
        }
      }
    });

    // Create sources
    source1 = new MemorySource(schema);
    source2 = new MemorySource(schema);
    source3 = new MemorySource(schema);

    source1.id = 'source1';
    source2.id = 'source2';
    source3.id = 'source3';

    // Create connectors
    source1to2Connector = new TransformConnector(source1, source2);
    source2to1Connector = new TransformConnector(source2, source1);
    source1to3Connector = new TransformConnector(source1, source3);
    source3to1Connector = new TransformConnector(source3, source1);
  },

  teardown: function() {
    source1to2Connector = source2to1Connector = null;
    source1 = source2 = null;
  }
});

test("consecutive transforms can be applied to one source and should be automatically applied to the other source", function() {
  expect(4);

  stop();

  source1.transform({
    op: 'add',
    path: ['planet', '123'],
    value: source1.normalize('planet', {name: 'Jupiter'})
  });

  source1.transform({
    op: 'replace',
    path: ['planet', '123', 'name'],
    value: 'Earth'

  }).then(function() {
    source1.find('planet', '123').then(function(planet1) {
      source2.find('planet', '123').then(function(planet2) {
        start();
        notStrictEqual(planet2, planet1, 'not the same object as the one originally inserted');
        equal(planet2.__id, planet1.__id, 'backup record has the same primary id');
        equal(planet2.name, planet1.name, 'backup record has the same name');
        equal(planet2.name, 'Earth', 'records have the updated name');
      });
    });
  });
});

test("an array of transforms can be applied to one source and should be automatically applied to the other source", function() {
  expect(4);

  stop();

  source1.transform([{
    op: 'add',
    path: ['planet', '123'],
    value: source1.normalize('planet', {name: 'Jupiter'})
  }, {
    op: 'replace',
    path: ['planet', '123', 'name'],
    value: 'Earth'
  }]).then(function() {
    source1.find('planet', '123').then(function(planet1) {
      source2.find('planet', '123').then(function(planet2) {
        start();
        notStrictEqual(planet2, planet1, 'not the same object as the one originally inserted');
        equal(planet2.__id, planet1.__id, 'backup record has the same primary id');
        equal(planet2.name, planet1.name, 'backup record has the same name');
        equal(planet2.name, 'Earth', 'records have the updated name');
      });
    });
  });
});

test("replacing value with null should not cause infinite update loop", function() {
  expect(4);

  stop();

  source1.transform({
    op: 'add',
    path: ['planet', '123'],
    value: source1.normalize('planet', {name: 'Jupiter'})
  }).then(function() {
    source1.transform({
      op: 'replace',
      path: ['planet', '123', 'name'],
      value: null
    }).then(function() {
      source1.find('planet', '123').then(function(planet1) {
        source2.find('planet', '123').then(function(planet2) {
          start();
          notStrictEqual(planet2, planet1, 'not the same object as the one originally inserted');
          strictEqual(planet2.__id, planet1.__id, 'backup record has the same primary id');
          strictEqual(planet2.name, planet1.name, 'backup record has the same name');
          strictEqual(planet2.name, null, 'records have name == null');
        });
      });
    });
  });
});
