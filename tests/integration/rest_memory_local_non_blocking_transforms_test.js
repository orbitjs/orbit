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
    var schema = {
      models: ['planet']
    };
    memoryStore = new MemoryStore({schema: schema});
    restStore = new RestStore({schema: schema});
    localStore = new LocalStore({schema: schema, autoload: false});

    memoryStore.id = 'memoryStore';
    restStore.id = 'restStore';
    localStore.id = 'localStore';

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
  expect(15);

  var localStoreTransforms = 0,
      restStoreTransforms = 0;

  localStore.on('didTransform', function(operation, result) {
    localStoreTransforms++;

    console.log('LOCAL STORE - didTransform', localStoreTransforms, operation, result);

    if (localStoreTransforms === 1) {
      equal(operation.op, 'add',                'local store - initial object addition');
      equal(result.name, 'Jupiter',             'local store - inserted - name - Jupiter');
      equal(result.classification, 'gas giant', 'local store - inserted - classification should be original');

    } else if (localStoreTransforms === 2) {
      // `id` is added when the REST POST response returns
      equal(operation.op, 'add',     'local store - id added');
      equal(result, 12345,           'local store - id');

    } else {
      ok(false, 'too many transforms');
    }
  });

  restStore.on('didTransform', function(operation, result) {
    restStoreTransforms++;

    console.log('REST STORE - didTransform', restStoreTransforms, operation, result);

    if (restStoreTransforms === 1) {
      start();
      ok(result.__id,                           'orbit id should be defined');
      equal(result.id, 12345,                   'server id should be defined now');
      equal(result.name, 'Jupiter',             'name should match');
      equal(result.classification, 'gas giant', 'classification should match');

    } else {
      ok(false, 'too many transforms');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memoryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memoryStore.length('planet'), 1,    'memory store should contain one record');
    ok(record.__id,                           'orbit id should be defined');
    equal(record.id, undefined,               'server id should NOT be defined yet');
    equal(record.name, 'Jupiter',             'name should match');
    equal(record.classification, 'gas giant', 'classification should match');

  }).then(function() {
    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
    });
  });
});

//test("records updated in memory should be updated with rest (via PATCH)", function() {
//  expect(25);
//
//  var localStoreTransforms = 0,
//      restStoreTransforms = 0;
//
//  localStore.on('didTransform', function(operation, result) {
//    localStoreTransforms++;
//
//    console.log('LOCAL STORE - didTransform', localStoreTransforms, operation, result);
//
//    if (localStoreTransforms === 1) {
//      equal(operation.op, 'add',                'local store - initial object addition');
//      equal(result.name, 'Jupiter',             'local store - inserted - name - Jupiter');
//      equal(result.classification, 'gas giant', 'local store - inserted - classification should be original');
//
//    } else if (localStoreTransforms === 2) {
//      equal(operation.op, 'replace', 'local store - name replaced');
//      equal(result, 'Earth',         'local store - name - Earth');
//
//    } else if (localStoreTransforms === 3) {
//      // `id` is added when the REST POST response returns
//      equal(operation.op, 'add',     'local store - id added');
//      equal(result, 12345,           'local store - id');
//
//    } else if (localStoreTransforms === 4) {
////TODO
//      // `id` is added when the REST POST response returns
//      equal(operation.op, 'add',     'local store - id added');
//      equal(result, 12345,           'local store - id');
//
//    } else if (localStoreTransforms === 5) {
//      // `name` gets temporarily changed back to Jupiter when the REST POST response returns
//      equal(operation.op, 'replace', 'local store - name replaced');
//      equal(result, 'Jupiter',       'local store - name - Jupiter');
//
//    } else if (localStoreTransforms === 6) {
//      // `name` gets changed back to Earth when the REST PATCH response returns
//      equal(operation.op, 'replace', 'local store - name replaced');
//      equal(result, 'Earth',         'local store - name - Earth');
//
//    } else {
//      ok(false, 'too many transforms');
//    }
//  });
//
//  restStore.on('didTransform', function(operation, result) {
//    restStoreTransforms++;
//
//    console.log('REST STORE - didTransform', restStoreTransforms, operation, result);
//
//    if (restStoreTransforms === 1) {
//      equal(operation.op, 'add',                'rest store - initial object addition');
//      equal(result.id, 12345,                   'rest store - inserted - id');
//      equal(result.name, 'Jupiter',             'rest store - inserted - name - Jupiter');
//      equal(result.classification, 'gas giant', 'rest store - inserted - classification - gas giant');
//
//    } else if (restStoreTransforms === 2) {
//      start();
//
//      // TODO - should be 'replace'?
//      equal(operation.op, 'add',                'rest store - name added');
//      equal(result, 'Earth',                    'rest store - name - Earth');
//
//    } else  {
//      ok(false, 'too many transforms');
//    }
//  });
//
//  /////////////////////////////////////////////////////////////////////////////
//
//  stop();
//  memoryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
//    equal(memoryStore.length('planet'), 1,    'memory store - inserted - should contain one record');
//    ok(record.__id,                           'memory store - inserted - orbit id should be defined');
//    equal(record.id, undefined,               'memory store - inserted - server id should NOT be defined yet');
//    equal(record.name, 'Jupiter',             'memory store - inserted - name - Jupiter');
//    equal(record.classification, 'gas giant', 'memory store - inserted - classification - gas giant');
//
//    server.respond('POST', '/planets', function(xhr) {
//      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
//      xhr.respond(201,
//                  {'Content-Type': 'application/json'},
//                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
//    });
//
//    record.name = 'Earth';
//    console.log("!!!!!!!!! BEFORE");
//    return memoryStore.update('planet', record);
//
//  }).then(function(record) {
//    console.log("!!!!!!!!! AFTER");
//    equal(record.name, 'Earth',               'memory store - updated - name - Earth');
//    equal(record.classification, 'gas giant', 'memory store - updated - classification - gas giant');
////    equal(result, 'Earth',                    'memory store - name - Earth');
//
//    server.respond('PATCH', '/planets/12345', function(xhr) {
//      deepEqual(JSON.parse(xhr.requestBody), {op: 'replace', path: '/planets/12345/name', value: 'Earth'}, 'PATCH request');
//      xhr.respond(200,
//                  {'Content-Type': 'application/json'},
//                  JSON.stringify({}));
//    });
//  });
//});

test("records patched in memory should be patched with rest", function() {
  expect(25);

  var localStoreTransforms = 0,
      restStoreTransforms = 0;

  localStore.on('didTransform', function(operation, result) {
    localStoreTransforms++;

    console.log('LOCAL STORE - didTransform', localStoreTransforms, operation, result);

    if (localStoreTransforms === 1) {
      equal(operation.op, 'add',                'local store - initial object addition');
      equal(result.name, 'Jupiter',             'local store - inserted - name - Jupiter');
      equal(result.classification, 'gas giant', 'local store - inserted - classification should be original');

    } else if (localStoreTransforms === 2) {
      equal(operation.op, 'replace', 'local store - name replaced');
      equal(result, 'Earth',         'local store - name - Earth');

    } else if (localStoreTransforms === 3) {
      // `id` is added when the REST POST response returns
      equal(operation.op, 'add',     'local store - id added');
      equal(result, 12345,           'local store - id');

    } else if (localStoreTransforms === 4) {
      // `name` gets temporarily changed back to Jupiter when the REST POST response returns
      equal(operation.op, 'replace', 'local store - name replaced');
      equal(result, 'Jupiter',       'local store - name - Jupiter');

    } else if (localStoreTransforms === 5) {
      // `name` gets changed back to Earth when the REST PATCH response returns
      equal(operation.op, 'replace', 'local store - name replaced');
      equal(result, 'Earth',         'local store - name - Earth');

    } else {
      ok(false, 'too many transforms');
    }
  });

  restStore.on('didTransform', function(operation, result) {
    restStoreTransforms++;

    console.log('REST STORE - didTransform', restStoreTransforms, operation, result);

    if (restStoreTransforms === 1) {
      equal(operation.op, 'add',                'rest store - initial object addition');
      equal(result.id, 12345,                   'rest store - inserted - id');
      equal(result.name, 'Jupiter',             'rest store - inserted - name - Jupiter');
      equal(result.classification, 'gas giant', 'rest store - inserted - classification - gas giant');

    } else if (restStoreTransforms === 2) {
      start();

      // TODO - should be 'replace'?
      equal(operation.op, 'add',                'rest store - name added');
      equal(result, 'Earth',                    'rest store - name - Earth');

    } else  {
      ok(false, 'too many transforms');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memoryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memoryStore.length('planet'), 1,    'memory store - inserted - should contain one record');
    ok(record.__id,                           'memory store - inserted - orbit id should be defined');
    equal(record.id, undefined,               'memory store - inserted - server id should NOT be defined yet');
    equal(record.name, 'Jupiter',             'memory store - inserted - name - Jupiter');
    equal(record.classification, 'gas giant', 'memory store - inserted - classification - gas giant');

    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
    });

    return memoryStore.patch('planet', record.__id, 'name', 'Earth');

  }).then(function(result) {
    equal(result, 'Earth',                    'memory store - name - Earth');

    server.respond('PATCH', '/planets/12345', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {op: 'replace', path: '/planets/12345/name', value: 'Earth'}, 'PATCH request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({}));
    });
  });
});

//test("records deleted in memory should be deleted with rest", function() {
//  expect(10);
//
//  memoryStore.on('didTransform', function(action, type, record) {
//    if (action === 'remove') {
//      equal(memoryStore.length('planet'), 0, 'memory store should be empty');
//    }
//  });
//
//  localStore.on('didTransform', function(action, type, record) {
//    if (action === 'remove') {
//      equal(localStore.length('planet'), 0, 'local store should be empty');
//      ok(record.deleted, 'local store - record should be marked `deleted`');
//      verifyLocalStorageContainsRecord(localStore.namespace, type, record);
//    }
//  });
//
//  restStore.on('didTransform', function(action, type, record) {
//    if (action === 'add') {
//      ok(true, 'rest store - record inserted');
//
//    } else if (action === 'remove') {
//      start();
//      equal(record.id, 12345, 'rest store - deleted - server id should be defined');
//      ok(record.deleted,      'rest store - deleted - record marked as deleted');
//    }
//  });
//
//  /////////////////////////////////////////////////////////////////////////////
//
//  stop();
//  memoryStore.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
//    equal(memoryStore.length('planet'), 1, 'memory store - inserted - should contain one record');
//
//    server.respond('POST', '/planets', function(xhr) {
//      deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
//      xhr.respond(201,
//                  {'Content-Type': 'application/json'},
//                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
//    });
//
//    return memoryStore.transform('remove', 'planet', {__id: planet.__id});
//
//  }).then(function() {
//
//    server.respond('DELETE', '/planets/12345', function(xhr) {
//      deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
//      xhr.respond(200,
//                  {'Content-Type': 'application/json'},
//                  JSON.stringify({}));
//    });
//  });
//});
