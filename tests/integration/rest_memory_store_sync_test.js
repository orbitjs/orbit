import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';
import RestStore from 'orbit/sources/rest_store';
import TransformConnector from 'orbit/connectors/transform_connector';
import RSVP from 'rsvp';

var server,
    memoryStore,
    restStore,
    memToRestConnector,
    restToMemConnector;

module("Integration - RestStore / MemoryStore Sync", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    memoryStore = new MemoryStore();
    restStore = new RestStore();
    restStore.namespace = 'dogs';

    memToRestConnector = new TransformConnector(memoryStore, restStore);
    restToMemConnector = new TransformConnector(restStore, memoryStore);
  },

  teardown: function() {
    memToRestConnector = restToMemConnector = null;
    memoryStore = restStore = null;

    server.restore();
  }
});

test("records inserted into the memory store should be automatically posted to the rest server", function() {
  expect(6);

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    equal(memoryStore.length, 1, 'store should contain one record');
    ok(dog.__id, 'memory store id should be defined');
    equal(dog.id, 12345, 'server id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
  });
});

test("records updated in the memory store should be automatically updated on the rest server (via PATCH)", function() {
  expect(7);

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
        equal(memoryStore.length, 1, 'store should contain one record');
        ok(dog.__id, 'memory store id should be defined');
        equal(dog.id, 12345, 'server id should be defined');
        equal(dog.name, 'Beatrice', 'name should match');
        equal(dog.gender, 'f', 'gender should match');
      }
    );
  });
});

test("records patched in the memory store should be automatically patched on the rest server", function() {
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
        equal(memoryStore.length, 1, 'store should contain one record');
        ok(dog.__id, 'memory store id should be defined');
        equal(dog.id, 12345, 'server id should be defined');
        equal(dog.name, 'Hubert', 'name should match');
        equal(dog.gender, 'f', 'gender should match');
      }
    );
  });
});

test("records deleted in the memory store should be automatically deleted on the rest server", function() {
  expect(3);

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
      }
    );
  });
});
