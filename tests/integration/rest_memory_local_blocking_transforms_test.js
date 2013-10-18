import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';
import RestStore from 'orbit/sources/rest_store';
import LocalStore from 'orbit/sources/local_store';
import TransformConnector from 'orbit/connectors/transform_connector';
import RSVP from 'rsvp';

var server,
    memoryStore,
    restStore,
    localStore,
    memToLocalConnector,
    memToRestConnector,
    restToMemConnector;

module("Integration - Rest / Memory / Local Transforms (Blocking)", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    // Create stores
    memoryStore = new MemoryStore();
    restStore = new RestStore();
    localStore = new LocalStore({autoload: false});

    // Connect MemoryStore -> LocalStore
    memToLocalConnector = new TransformConnector(memoryStore, localStore);

    // Connect MemoryStore <-> RestStore
    memToRestConnector = new TransformConnector(memoryStore, restStore);
    restToMemConnector = new TransformConnector(restStore, memoryStore);
  },

  teardown: function() {
    memToLocalConnector = memToRestConnector = restToMemConnector = null;
    memoryStore = restStore = localStore = null;

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
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    equal(localStore.length('planet'), 1, 'local store should contain one record');
    verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet, ['__ver']);
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
  restStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    equal(localStore.length('planet'), 1, 'local store should contain one record');
    verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet, ['__ver']);
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
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Earth', classification: 'terrestrial'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Earth', classification: 'terrestrial'}));
  });

  stop();
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memoryStore.transform('update', 'planet', {__id: planet.__id, name: 'Earth', classification: 'terrestrial'}).then(
      function(planet) {
        start();
        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Earth', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');

        equal(localStore.length('planet'), 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet, ['__ver']);
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
  restStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    restStore.transform('update', 'planet', {__id: planet.__id, id: planet.id, name: 'Earth', classification: 'terrestrial'}).then(
      function(planet) {
        start();
        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Earth', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');

        equal(localStore.length('planet'), 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet, ['__ver']);
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
    deepEqual(JSON.parse(xhr.requestBody), {classification: 'terrestrial'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'terrestrial'}));
  });

  stop();
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memoryStore.transform('patch', 'planet', {__id: planet.__id, classification: 'terrestrial'}).then(
      function(planet) {
        start();
        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Jupiter', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');
      }
    );
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
    deepEqual(JSON.parse(xhr.requestBody), {classification: 'terrestrial'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'terrestrial'}));
  });

  stop();
  restStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    restStore.transform('patch', 'planet', {__id: planet.__id, classification: 'terrestrial'}).then(
      function(planet) {
        start();
        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Jupiter', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');

        equal(localStore.length('planet'), 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet, ['__ver']);
      }
    );
  });
});

test("records deleted in memory should be deleted with rest", function() {
  expect(6);

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
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memoryStore.transform('delete', 'planet', {__id: planet.__id}).then(
      function(record) {
        start();
        equal(memoryStore.length('planet'), 0, 'memory store should be empty');
        equal(localStore.length('planet'), 0, 'local store should be empty');

        ok(record.deleted, 'record should be marked `deleted`');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', record, ['__ver']);
      }
    );
  });
});

test("records deleted with rest should be deleted in memory", function() {
  expect(6);

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
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memoryStore.transform('delete', 'planet', {__id: planet.__id}).then(
      function(record) {
        start();
        equal(memoryStore.length('planet'), 0, 'memory store should be empty');
        equal(localStore.length('planet'), 0, 'local store should be empty');

        ok(record.deleted, 'record should be marked `deleted`');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', record, ['__ver']);
      }
    );
  });
});
