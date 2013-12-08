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
    var schema = {
      models: ['planet']
    };
    memoryStore = new MemoryStore({schema: schema});
    restStore = new RestStore({schema: schema});
    localStore = new LocalStore({schema: schema, autoload: false});

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
  memoryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    equal(localStore.length('planet'), 1, 'local store should contain one record');
    verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet);
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
  restStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    equal(localStore.length('planet'), 1, 'local store should contain one record');
    verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet);
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
                JSON.stringify());
  });

  stop();
  memoryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    planet.name = 'Earth';
    memoryStore.update('planet', planet).then(
      function(planet) {
        start();
        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Earth', 'name should match');
        equal(planet.classification, 'gas giant', 'classification was not updated');

        equal(localStore.length('planet'), 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet);
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
  restStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    planet.name = 'Earth';
    planet.classification = 'terrestrial';
    restStore.update('planet', planet).then(
      function(planet) {
        start();
        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Earth', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');

        equal(localStore.length('planet'), 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet);
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
  memoryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memoryStore.patch('planet', planet.__id, 'classification', 'terrestrial').then(function() {
      memoryStore.find('planet', planet.__id).then(function(planet) {
        start();
        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
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
  restStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    restStore.patch('planet', planet.__id, 'classification', 'terrestrial').then(function() {
      memoryStore.find('planet', planet.__id).then(function(planet) {
        start();

        equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
        ok(planet.__id, 'orbit id should be defined');
        equal(planet.id, 12345, 'server id should be defined');
        equal(planet.name, 'Jupiter', 'name should match');
        equal(planet.classification, 'terrestrial', 'classification should match');

        equal(localStore.length('planet'), 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, 'planet', planet);
      });
    });
  });
});

test("records deleted in memory should be deleted with rest", function() {
  expect(8);

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
  memoryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    memoryStore.remove('planet', planet.__id).then(function() {
      start();

      equal(memoryStore.length('planet'), 0, 'memory store should be empty');
      equal(localStore.length('planet'), 0, 'local store should be empty');
      equal(restStore.length('planet'), 0, 'rest store cache should be empty');

      equal(memoryStore.isDeleted(['planet', planet.__id]), true, 'record should be marked deleted in memory store');
      equal(localStore.isDeleted(['planet', planet.__id]), true, 'record should be marked deleted in local store');
      equal(restStore.isDeleted(['planet', planet.__id]), true, 'record should be marked deleted in rest store');
    });
  });
});

test("records deleted with rest should be deleted in memory", function() {
  expect(8);

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
  restStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    restStore.remove('planet', planet.__id).then(function() {
      start();

      equal(memoryStore.length('planet'), 0, 'memory store should be empty');
      equal(localStore.length('planet'), 0, 'local store should be empty');
      equal(restStore.length('planet'), 0, 'rest store cache should be empty');

      equal(memoryStore.isDeleted(['planet', planet.__id]), true, 'record should be marked deleted in memory store');
      equal(localStore.isDeleted(['planet', planet.__id]), true, 'record should be marked deleted in local store');
      equal(restStore.isDeleted(['planet', planet.__id]), true, 'record should be marked deleted in rest store');
    });
  });
});
