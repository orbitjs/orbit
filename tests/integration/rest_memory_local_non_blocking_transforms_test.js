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

module("Integration - Rest / Memory / Local Transforms (Non-Blocking)", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    Orbit.ajax = window.jQuery.ajax;

    // Fake xhr
    server = window.sinon.fakeServer.create();

    // Create stores
    memoryStore = new MemoryStore();
    restStore = new RestStore();
    localStore = new LocalStore({autoload: false});

    // Connect MemoryStore -> LocalStore
    memToLocalConnector = new TransformConnector(memoryStore, localStore, {blocking: false});

    // Connect MemoryStore <-> RestStore
    memToRestConnector = new TransformConnector(memoryStore, restStore, {blocking: false});
    restToMemConnector = new TransformConnector(restStore, memoryStore, {blocking: false});
  },

  teardown: function() {
    memToLocalConnector = memToRestConnector = restToMemConnector = null;
    memoryStore = restStore = localStore = null;

    // Restore xhr
    server.restore();
  }
});

test("records inserted into memory should be posted with rest", function() {
  expect(12);

  localStore.on('didTransform', function(action, type, record) {
    if (action === 'insert') {
      equal(localStore.length('planet'), 1,     'local store should contain one record');
      verifyLocalStorageContainsRecord(localStore.namespace, type, record, ['__ver']);
    }
  });

  restStore.on('didTransform', function(action, type, record) {
    if (action === 'insert') {
      start();
      ok(record.__id,                           'orbit id should be defined');
      equal(record.id, 12345,                   'server id should be defined now');
      equal(record.name, 'Jupiter',             'name should match');
      equal(record.classification, 'gas giant', 'classification should match');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memoryStore.length('planet'), 1, 'memory store should contain one record');
    ok(record.__id,              'orbit id should be defined');
    equal(record.id, undefined,  'server id should NOT be defined yet');
    equal(record.name, 'Jupiter', 'name should match');
    equal(record.classification, 'gas giant',    'classification should match');

  }).then(function() {
    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
    });
  });
});

test("records updated in memory should be updated with rest (via PATCH)", function() {
  expect(19);

  var localStorePatchCount = 0;

  localStore.on('didTransform', function(action, type, record) {
    if (action === 'insert') {
      equal(localStore.length('planet'), 1, 'local store - inserted - should contain one record');

    } else if (action === 'patch') {
      localStorePatchCount++;

      if (localStorePatchCount === 1) {
        equal(record.id, undefined, 'local store - patch 1 - server id should NOT be defined yet');

      } else if (localStorePatchCount === 2) {
        equal(record.id, 12345, 'local store - patch 2 - server id should be defined now');
        verifyLocalStorageContainsRecord(localStore.namespace, type, record, ['__ver']);
      }
    }
  });

  restStore.on('didTransform', function(action, type, record) {
    if (action === 'insert') {
      ok(record.__id,                           'rest store - inserted - orbit id should be defined');
      equal(record.id, 12345,                   'rest store - inserted - server id should be defined');
      equal(record.name, 'Jupiter',             'rest store - inserted - name should be original');
      equal(record.classification, 'gas giant', 'rest store - inserted - classification should be original');

    } else if (action === 'patch') {
      start();
      ok(record.__id,                             'rest store - patched - orbit id should be defined');
      equal(record.id, 12345,                     'rest store - patched - server id should be defined');
      equal(record.name, 'Earth',                 'rest store - patched - name should be updated');
      equal(record.classification, 'terrestrial', 'rest store - patched - classification should be updated');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memoryStore.length('planet'), 1, 'memory store - inserted - should contain one record');
    ok(record.__id,                           'memory store - inserted - orbit id should be defined');
    equal(record.id, undefined,               'memory store - inserted - server id should NOT be defined yet');
    equal(record.name, 'Jupiter',             'memory store - inserted - name should match');
    equal(record.classification, 'gas giant', 'memory store - inserted - classification should match');

    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
    });

    return memoryStore.transform('update', 'planet', {__id: record.__id, name: 'Earth', classification: 'terrestrial'});

  }).then(function() {

    server.respond('PATCH', '/planets/12345', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Earth', classification: 'terrestrial'}, 'PATCH request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Earth', classification: 'terrestrial'}));
    });
  });
});

test("records patched in memory should be patched with rest", function() {
  expect(19);

  var localStorePatchCount = 0;

  localStore.on('didTransform', function(action, type, record) {
    if (action === 'insert') {
      equal(localStore.length('planet'), 1, 'local store - inserted - should contain one record');

    } else if (action === 'patch') {
      localStorePatchCount++;

      if (localStorePatchCount === 1) {
        equal(record.id, undefined, 'local store - patch 1 - server id should NOT be defined yet');

      } else if (localStorePatchCount === 2) {
        equal(record.id, 12345, 'local store - patch 2 - server id should be defined now');
        verifyLocalStorageContainsRecord(localStore.namespace, type, record, ['__ver']);
      }
    }
  });

  restStore.on('didTransform', function(action, type, record) {
    if (action === 'insert') {
      ok(record.__id,                           'rest store - inserted - orbit id should be defined');
      equal(record.id, 12345,                   'rest store - inserted - server id should be defined');
      equal(record.name, 'Jupiter',             'rest store - inserted - name should be original');
      equal(record.classification, 'gas giant', 'rest store - inserted - classification should be original');

    } else if (action === 'patch') {
      start();
      ok(record.__id,                             'rest store - patched - orbit id should be defined');
      equal(record.id, 12345,                     'rest store - patched - server id should be defined');
      equal(record.name, 'Earth',                 'rest store - patched - name should be updated');
      equal(record.classification, 'terrestrial', 'rest store - patched - classification should be updated');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memoryStore.length('planet'), 1, 'memory store - inserted - should contain one record');
    ok(record.__id,                           'memory store - inserted - orbit id should be defined');
    equal(record.id, undefined,               'memory store - inserted - server id should NOT be defined yet');
    equal(record.name, 'Jupiter',             'memory store - inserted - name should match');
    equal(record.classification, 'gas giant', 'memory store - inserted - classification should match');

    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
    });

    return memoryStore.transform('patch', 'planet', {__id: record.__id, name: 'Earth', classification: 'terrestrial'});

  }).then(function() {

    server.respond('PATCH', '/planets/12345', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Earth', classification: 'terrestrial'}, 'PATCH request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Earth', classification: 'terrestrial'}));
    });
  });
});

test("records deleted in memory should be deleted with rest", function() {
  expect(10);

  memoryStore.on('didTransform', function(action, type, record) {
    if (action === 'delete') {
      equal(memoryStore.length('planet'), 0, 'memory store should be empty');
    }
  });

  localStore.on('didTransform', function(action, type, record) {
    if (action === 'delete') {
      equal(localStore.length('planet'), 0, 'local store should be empty');
      ok(record.deleted, 'local store - record should be marked `deleted`');
      verifyLocalStorageContainsRecord(localStore.namespace, type, record);
    }
  });

  restStore.on('didTransform', function(action, type, record) {
    if (action === 'insert') {
      ok(true, 'rest store - record inserted');

    } else if (action === 'delete') {
      start();
      equal(record.id, 12345, 'rest store - deleted - server id should be defined');
      ok(record.deleted,      'rest store - deleted - record marked as deleted');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memoryStore.transform('insert', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(memoryStore.length('planet'), 1, 'memory store - inserted - should contain one record');

    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
    });

    return memoryStore.transform('delete', 'planet', {__id: planet.__id});

  }).then(function() {

    server.respond('DELETE', '/planets/12345', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({}));
    });
  });
});
