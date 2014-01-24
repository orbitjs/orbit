import Orbit from 'orbit/main';
import MemorySource from 'orbit_core_sources/memory_source';
import JSONAPISource from 'orbit_core_sources/jsonapi_source';
import LocalStorageSource from 'orbit_core_sources/local_storage_source';
import TransformConnector from 'orbit/connectors/transform_connector';
import { Promise } from 'rsvp';

var server,
    memorySource,
    restSource,
    localSource,
    memToLocalConnector,
    memToRestConnector,
    restToMemConnector;

module("Integration - Rest / Memory / Local Transforms (Blocking)", {
  setup: function() {
    Orbit.Promise = Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    // Create sources
    var schema = {
      idField: '__id',
      models: {
        planet: {
        }
      }
    };
    memorySource = new MemorySource(schema);
    restSource = new JSONAPISource(schema);
    localSource = new LocalStorageSource(schema, {autoload: false});

    memorySource.id = 'memorySource';
    restSource.id = 'restSource';
    localSource.id = 'localSource';

    // Connect MemorySource -> LocalStorageSource
    memToLocalConnector = new TransformConnector(memorySource, localSource);

    // Connect MemorySource <-> JSONAPISource
    memToRestConnector = new TransformConnector(memorySource, restSource);
    restToMemConnector = new TransformConnector(restSource, memorySource);
  },

  teardown: function() {
    memToLocalConnector = memToRestConnector = restToMemConnector = null;
    memorySource = restSource = localSource = null;

    server.restore();
  }
});

test("records inserted into memory should be posted with rest", function() {
  expect(8);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(memorySource.length('planet'), 1, 'memory source should contain one record');
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    equal(localSource.length('planet'), 1, 'local source should contain one record');
    verifyLocalStorageContainsRecord(localSource.namespace, 'planet', planet);
  });
});

test("records posted with rest should be inserted into memory", function() {
  expect(8);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  restSource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(memorySource.length('planet'), 1, 'memory source should contain one record');
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    equal(localSource.length('planet'), 1, 'local source should contain one record');
    verifyLocalStorageContainsRecord(localSource.namespace, 'planet', planet);
  });
});

test("records updated in memory should be updated with rest (via PATCH)", function() {
  expect(9);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });
  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'replace', path: '/planets/12345/name', value: 'Earth'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    planet.name = 'Earth';
    memorySource.update('planet', planet).then(
      function(planet) {
        start();
        equal(memorySource.length('planet'), 1, 'memory source should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Earth', 'name should match');
        equal(planet.classification, 'gas giant', 'classification was not updated');

        equal(localSource.length('planet'), 1, 'local source should contain one record');
        verifyLocalStorageContainsRecord(localSource.namespace, 'planet', planet);
      }
    );
  });
});

test("records updated with rest should be updated in memory", function() {
  expect(9);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });
  server.respondWith('PUT', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {id: 12345, name: 'Earth', classification: 'terrestrial'}, 'PUT request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Earth', classification: 'terrestrial'}));
  });

  stop();
  restSource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    planet.name = 'Earth';
    planet.classification = 'terrestrial';
    restSource.update('planet', planet).then(
      function(planet) {
        start();
        equal(memorySource.length('planet'), 1, 'memory source should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Earth', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');

        equal(localSource.length('planet'), 1, 'local source should contain one record');
        verifyLocalStorageContainsRecord(localSource.namespace, 'planet', planet);
      }
    );
  });
});

test("records patched in memory should be patched with rest", function() {
  expect(7);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });
  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'replace', path: '/planets/12345/classification', value: 'terrestrial'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memorySource.patch('planet', planet.__id, 'classification', 'terrestrial').then(function() {
      memorySource.find('planet', planet.__id).then(function(planet) {
        start();
        equal(memorySource.length('planet'), 1, 'memory source should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Jupiter', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');
      });
    });
  });
});

test("records patched with rest should be patched in memory", function() {
  expect(9);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });
  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'replace', path: '/planets/12345/classification', value: 'terrestrial'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  restSource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    restSource.patch('planet', planet.__id, 'classification', 'terrestrial').then(function() {
      memorySource.find('planet', planet.__id).then(function(planet) {
        start();

        equal(memorySource.length('planet'), 1, 'memory source should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Jupiter', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');

        equal(localSource.length('planet'), 1, 'local source should contain one record');
        verifyLocalStorageContainsRecord(localSource.namespace, 'planet', planet);
      });
    });
  });
});

test("records deleted in memory should be deleted with rest", function() {
  expect(5);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });
  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memorySource.remove('planet', planet.__id).then(function() {
      start();

      equal(memorySource.length('planet'), 0, 'memory source should be empty');
      equal(localSource.length('planet'), 0, 'local source should be empty');
      equal(restSource.length('planet'), 0, 'rest source cache should be empty');
    });
  });
});

test("records deleted with rest should be deleted in memory", function() {
  expect(5);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });
  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  restSource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    restSource.remove('planet', planet.__id).then(function() {
      start();

      equal(memorySource.length('planet'), 0, 'memory source should be empty');
      equal(localSource.length('planet'), 0, 'local source should be empty');
      equal(restSource.length('planet'), 0, 'rest source cache should be empty');
    });
  });
});
