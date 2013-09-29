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

module("Integration - Rest / Memory / Local Synchronous Transforms", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    memoryStore = new MemoryStore();
    restStore = new RestStore();
    localStore = new LocalStore();

    // Connect MemoryStore -> LocalStore
    memToLocalConnector = new TransformConnector(memoryStore, localStore);

    // Connect MemoryStore <-> RestStore
    memToRestConnector = new TransformConnector(memoryStore, restStore);
    restToMemConnector = new TransformConnector(restStore, memoryStore);

    // Minimal RestStore config
    restStore.namespace = 'dogs';
  },

  teardown: function() {
    memToLocalConnector = memToRestConnector = restToMemConnector = null;
    memoryStore = restStore = localStore = null;

    server.restore();
  }
});

test("records inserted into memory should be posted with rest", function() {
  expect(8);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    equal(memoryStore.length, 1, 'memory store should contain one record');
    ok(dog.__id, 'orbit id should be defined');
    equal(dog.id, 12345, 'server id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');

    equal(localStore.length, 1, 'local store should contain one record');
    verifyLocalStorageContainsRecord(localStore.namespace, dog);
  });
});

test("records posted with rest should be inserted into memory", function() {
  expect(8);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  restStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    equal(memoryStore.length, 1, 'memory store should contain one record');
    ok(dog.__id, 'orbit id should be defined');
    equal(dog.id, 12345, 'server id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');

    equal(localStore.length, 1, 'local store should contain one record');
    verifyLocalStorageContainsRecord(localStore.namespace, dog);
  });
});

test("records updated in memory should be updated with rest (via PATCH)", function() {
  expect(9);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });
  server.respondWith('PATCH', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Beatrice', gender: 'f'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Beatrice', gender: 'f'}));
  });

  stop();
  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    memoryStore.updateRecord({__id: dog.__id, name: 'Beatrice', gender: 'f'}).then(
      function(dog) {
        start();
        equal(memoryStore.length, 1, 'memory store should contain one record');
        ok(dog.__id, 'orbit id should be defined');
        equal(dog.id, 12345, 'server id should be defined');
        equal(dog.name, 'Beatrice', 'name should match');
        equal(dog.gender, 'f', 'gender should match');

        equal(localStore.length, 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, dog);
      }
    );
  });
});

test("records updated with rest should be updated in memory", function() {
  expect(9);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });
  server.respondWith('PUT', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {id: 12345, name: 'Beatrice', gender: 'f'}, 'PUT request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Beatrice', gender: 'f'}));
  });

  stop();
  restStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    restStore.updateRecord({__id: dog.__id, id: dog.id, name: 'Beatrice', gender: 'f'}).then(
      function(dog) {
        start();
        equal(memoryStore.length, 1, 'memory store should contain one record');
        ok(dog.__id, 'orbit id should be defined');
        equal(dog.id, 12345, 'server id should be defined');
        equal(dog.name, 'Beatrice', 'name should match');
        equal(dog.gender, 'f', 'gender should match');

        equal(localStore.length, 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, dog);
      }
    );
  });
});

test("records patched in memory should be patched with rest", function() {
  expect(7);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });
  server.respondWith('PATCH', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {gender: 'f'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'f'}));
  });

  stop();
  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    memoryStore.patchRecord({__id: dog.__id, gender: 'f'}).then(
      function(dog) {
        start();
        equal(memoryStore.length, 1, 'memory store should contain one record');
        ok(dog.__id, 'orbit id should be defined');
        equal(dog.id, 12345, 'server id should be defined');
        equal(dog.name, 'Hubert', 'name should match');
        equal(dog.gender, 'f', 'gender should match');
      }
    );
  });
});

test("records patched with rest should be patched in memory", function() {
  expect(9);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });
  server.respondWith('PATCH', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {gender: 'f'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'f'}));
  });

  stop();
  restStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    restStore.patchRecord({__id: dog.__id, gender: 'f'}).then(
      function(dog) {
        start();
        equal(memoryStore.length, 1, 'memory store should contain one record');
        ok(dog.__id, 'orbit id should be defined');
        equal(dog.id, 12345, 'server id should be defined');
        equal(dog.name, 'Hubert', 'name should match');
        equal(dog.gender, 'f', 'gender should match');

        equal(localStore.length, 1, 'local store should contain one record');
        verifyLocalStorageContainsRecord(localStore.namespace, dog);
      }
    );
  });
});

test("records deleted in memory should be deleted with rest", function() {
  expect(5);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });
  server.respondWith('DELETE', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    memoryStore.destroyRecord({__id: dog.__id}).then(
      function() {
        start();
        equal(memoryStore.length, 0, 'memory store should be empty');

        equal(localStore.length, 0, 'local store should be empty');
        verifyLocalStorageIsEmpty(localStore.namespace);
      }
    );
  });
});

test("records deleted with rest should be deleted in memory", function() {
  expect(5);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });
  server.respondWith('DELETE', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    memoryStore.destroyRecord({__id: dog.__id}).then(
      function() {
        start();
        equal(memoryStore.length, 0, 'memory store should be empty');

        equal(localStore.length, 0, 'local store should be empty');
        verifyLocalStorageIsEmpty(localStore.namespace);
      }
    );
  });
});
