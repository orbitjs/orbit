import Orbit from 'orbit/main';
import Schema from 'orbit_common/schema';
import LocalStorageSource from 'orbit_common/local_storage_source';
import JSONAPISource from 'orbit_common/jsonapi_source';
import TransformConnector from 'orbit/transform_connector';
//import { verifyLocalStorageContainsRecord } from 'test_helper';
import { Promise } from 'rsvp';

var restSource,
    localSource,
    server,
    restToLocalConnector;

///////////////////////////////////////////////////////////////////////////////

module("Integration - RestSource Sync with Connector", {
  setup: function() {
    Orbit.Promise = Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    // Create schema
    var schema = new Schema({
      models: {
        planet: {}
      }
    });

    // Create sources
    localSource = new LocalStorageSource(schema);
    restSource = new JSONAPISource(schema);

    restToLocalConnector = new TransformConnector(restSource, localSource);
  },

  teardown: function() {
    localSource = restSource = null;
    server.restore();
  }
});

test("it exists", function() {
  ok(restSource);
});

test("#REST service syncs with local storage after find", function() {
  expect(3);
  server.respondWith('GET', '/planets', function(xhr) {
      ok(true, 'GET request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify([{id: 12345, name: 'Jupiter', classification: 'gas giant'}]));
  });
  stop();
  restSource.find('planet').then(function(planets) {
    start();
    equal(restSource.length('planet'), 1, 'rest source cache size should == 1');
    equal(localSource.length('planet'), 1, 'local source cache size should == 1');
  });
});

