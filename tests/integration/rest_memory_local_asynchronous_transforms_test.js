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

module("Integration - Rest / Memory / Local Asynchronous Transforms", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;
    server.autoRespondAfter = 50;

    memoryStore = new MemoryStore();
    restStore = new RestStore();
    localStore = new LocalStore();

    // Connect MemoryStore -> LocalStore
    memToLocalConnector = new TransformConnector(memoryStore, localStore, {async: false});

    // Connect MemoryStore <-> RestStore
    memToRestConnector = new TransformConnector(memoryStore, restStore, {async: true});
    restToMemConnector = new TransformConnector(restStore, memoryStore, {async: false});

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
  expect(12);

  stop();

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  localStore.on('didInsertRecord', function(data, record) {
    equal(localStore.length, 1, 'local store should contain one record');
    verifyLocalStorageContainsRecord(localStore.namespace, record, ['__ver']);
  });

  restStore.on('didInsertRecord', function(data, record) {
    start();

    ok(record.__id, 'orbit id should be defined');
    equal(record.id, 12345, 'server id should be defined now');
    equal(record.name, 'Hubert', 'name should match');
    equal(record.gender, 'm', 'gender should match');
  });

  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(record) {
    equal(memoryStore.length, 1, 'memory store should contain one record');
    ok(record.__id, 'orbit id should be defined');
    equal(record.id, undefined, 'server id should NOT be defined yet');
    equal(record.name, 'Hubert', 'name should match');
    equal(record.gender, 'm', 'gender should match');
  });
});

test("records updated in memory should be updated with rest (via PATCH)", function() {
  expect(15);

  stop();

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

  restStore.on('didInsertRecord', function(data, record) {
    equal(record.id, 12345, 'server id should be defined now');
  });

  restStore.on('didPatchRecord', function(data, record) {
    start();

    ok(record.__id, 'orbit id should be defined');
    equal(record.id, 12345, 'server id should be defined');
    equal(record.name, 'Beatrice', 'name should match');
    equal(record.gender, 'f', 'gender should match');
    equal(memoryStore.length, 1, 'memory store should contain one record');
    equal(localStore.length, 1, 'local store should contain one record');

    verifyLocalStorageContainsRecord(localStore.namespace, record, ['__ver']);
  });

  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(record) {
    equal(memoryStore.length, 1, 'memory store should contain one record');
    ok(record.__id, 'orbit id should be defined');
    equal(record.id, undefined, 'server id should NOT be defined yet');
    equal(record.name, 'Hubert', 'name should match');
    equal(record.gender, 'm', 'gender should match');

    memoryStore.updateRecord({__id: record.__id, name: 'Beatrice', gender: 'f'});
  });
});

//test("records patched in memory should be patched with rest", function() {
//  expect(7);
//
//  stop();
//
//  server.respondWith('POST', '/dogs', function(xhr) {
//    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
//    xhr.respond(201,
//                {'Content-Type': 'application/json'},
//                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
//  });
//
//  server.respondWith('PATCH', '/dogs/12345', function(xhr) {
//    deepEqual(JSON.parse(xhr.requestBody), {gender: 'f'}, 'PATCH request');
//    xhr.respond(200,
//                {'Content-Type': 'application/json'},
//                JSON.stringify({id: 12345, name: 'Hubert', gender: 'f'}));
//  });
//
//  restStore.on('didInsertRecord', function(data, record) {
//    equal(record.id, 12345, 'server id should be defined now');
//    start();
//  });
//
//  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
//    memoryStore.patchRecord({__id: dog.__id, gender: 'f'}).then(
//      function(dog) {
//        equal(memoryStore.length, 1, 'memory store should contain one record');
//        ok(dog.__id, 'orbit id should be defined');
//        equal(dog.id, undefined, 'server id should NOT be defined yet');
//        equal(dog.name, 'Hubert', 'name should match');
//        equal(dog.gender, 'f', 'gender should match');
//      }
//    );
//  });
//});
//
//test("records deleted in memory should be deleted with rest", function() {
//  expect(5);
//
//  server.respondWith('POST', '/dogs', function(xhr) {
//    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
//    xhr.respond(201,
//                {'Content-Type': 'application/json'},
//                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
//  });
//  server.respondWith('DELETE', '/dogs/12345', function(xhr) {
//    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
//    xhr.respond(200,
//                {'Content-Type': 'application/json'},
//                JSON.stringify({}));
//  });
//
//  stop();
//  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
//    memoryStore.destroyRecord({__id: dog.__id}).then(
//      function() {
//        start();
//        equal(memoryStore.length, 0, 'memory store should be empty');
//
//        equal(localStore.length, 0, 'local store should be empty');
//        verifyLocalStorageIsEmpty(localStore.namespace);
//      }
//    );
//  });
//});
