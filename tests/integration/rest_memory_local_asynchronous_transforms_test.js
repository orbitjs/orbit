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
    server.autoRespondAfter = 100;

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
  expect(19);

  var localStorePatchCount = 0;

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

  localStore.on('didInsertRecord', function(data, record) {
    equal(localStore.length, 1, 'local store - inserted - should contain one record');
  });

  localStore.on('didPatchRecord', function(data, record) {
    localStorePatchCount++;

    if (localStorePatchCount === 1) {
      equal(record.id, undefined, 'local store - patch 1 - server id should NOT be defined yet');

    } else if (localStorePatchCount === 2) {
      equal(record.id, 12345, 'local store - patch 2 - server id should be defined now');
      verifyLocalStorageContainsRecord(localStore.namespace, record, ['__ver']);
    }
  });

  restStore.on('didInsertRecord', function(data, record) {
    ok(record.__id,                'rest store - inserted - orbit id should be defined');
    equal(record.id, 12345,        'rest store - inserted - server id should be defined');
    equal(record.name, 'Hubert',   'rest store - inserted - name should be original');
    equal(record.gender, 'm',      'rest store - inserted - gender should be original');
  });

  restStore.on('didPatchRecord', function(data, record) {
    start();

    ok(record.__id,                'rest store - patched - orbit id should be defined');
    equal(record.id, 12345,        'rest store - patched - server id should be defined');
    equal(record.name, 'Beatrice', 'rest store - patched - name should be updated');
    equal(record.gender, 'f',      'rest store - patched - gender should be updated');
  });

  stop();
  memoryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(record) {
    equal(memoryStore.length, 1, 'memory store - inserted - should contain one record');
    ok(record.__id,              'memory store - inserted - orbit id should be defined');
    equal(record.id, undefined,  'memory store - inserted - server id should NOT be defined yet');
    equal(record.name, 'Hubert', 'memory store - inserted - name should match');
    equal(record.gender, 'm',    'memory store - inserted - gender should match');

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
