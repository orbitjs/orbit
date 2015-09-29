import Orbit from 'orbit/main';
import Operation from 'orbit/operation';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';
import {
  addRecordOperation
} from 'orbit-common/lib/operations';

var source1,
    source2,
    source3,
    source1to2Connector,
    source2to1Connector,
    source1to3Connector,
    source3to1Connector;

var counter = 0;

module("Integration - Three Memory Source Sync (Blocking / Non-blocking)", {
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
    source1 = new MemorySource({schema: schema});
    source2 = new MemorySource({schema: schema});
    source3 = new MemorySource({schema: schema});

    source1.id = 'source1';
    source2.id = 'source2';
    source3.id = 'source3';

    // Create blocking & non-blocking connectors
    source1to2Connector = new TransformConnector(source1, source2, {blocking: false});
    source2to1Connector = new TransformConnector(source2, source1);
    source1to3Connector = new TransformConnector(source1, source3, {blocking: false});
    source3to1Connector = new TransformConnector(source3, source1);
  },

  teardown: function() {
    source1to2Connector = source2to1Connector = null;
    source1to3Connector = source3to1Connector = null;
    source1 = source2 = source3 = null;
  }
});

test('Spontaneous information from sources', function({async}) {
  const done = async();
  expect(15);

  const planetIds = [];

  // For the use-case in this test - source2 and source3 are a socket connection
  // to an observatory discovering planets!
  //
  // This code is meant to represent how a socket server would broadcast a new
  // discovery from the socket data.
  function discover(source, planetName) {
    source.transform(addRecordOperation({
      id: planetName,
      type: 'planet',
      attributes: {name: planetName}
    }));
    planetIds.push(planetName);

    return source.settleTransforms();
  }

  // also, there is some async didTransform listener that takes 10ms
  source1.on('didTransform', function() {
    return new Promise(function(resolve) {
      setTimeout(resolve, 10);
    });
  });

  // and the source 2 and 3 connections happen after it
  source1to2Connector.deactivate();
  source1to2Connector.activate();
  source1to3Connector.deactivate();
  source1to3Connector.activate();

  Promise
    .all([
      discover(source3, "earth"),
      discover(source2, "mars"),
      discover(source3, "mercury"),
      discover(source2, "jupiter"),
      discover(source2, "saturn")
    ])
    .then(function() {
      [source1, source2, source3].forEach((source) => {
        planetIds.forEach((planetId) => {
          ok(source1.retrieve(['planet', planetId]), `${source.id} - added ${planetId}`);
        });
      });

      done();
    });
});
