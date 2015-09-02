import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import { clone } from 'orbit/lib/objects';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import JSONAPISource from 'orbit-common/jsonapi-source';
import LocalStorageSource from 'orbit-common/local-storage-source';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';
import jQuery from 'jquery';

var server,
    memorySource,
    restSource,
    localSource,
    memToLocalConnector,
    memToRestConnector,
    restToMemConnector;

module("Integration - Rest / Memory / Local Transforms (Non-Blocking)", {
  setup: function() {
    Orbit.Promise = Promise;
    Orbit.ajax = jQuery.ajax;

    // Fake xhr
    server = sinon.fakeServer.create();

    // Create schema
    var schema = new Schema({
      modelDefaults: {
        keys: {
          '__id': {primaryKey: true, defaultValue: uuid},
          'id': {}
        }
      },
      models: {
        planet: {
          attributes: {
            name: {type: 'string'},
            classification: {type: 'string'}
          }
        }
      }
    });

    // Create sources
    memorySource = new MemorySource({schema: schema});
    restSource = new JSONAPISource({schema: schema});
    localSource = new LocalStorageSource({schema: schema, autoload: false});

    memorySource.id = 'memorySource';
    restSource.id = 'restSource';
    localSource.id = 'localSource';

    // Connect MemorySource -> LocalStorageSource
    memToLocalConnector = new TransformConnector(memorySource, localSource, {blocking: false});

    // Connect MemorySource <-> JSONAPISource
    memToRestConnector = new TransformConnector(memorySource, restSource, {blocking: false});
    restToMemConnector = new TransformConnector(restSource, memorySource, {blocking: false});
  },

  teardown: function() {
    memToLocalConnector = memToRestConnector = restToMemConnector = null;
    memorySource = restSource = localSource = null;

    // Restore xhr
    server.restore();
  }
});

test("records inserted into memory should be posted with rest", function() {
  expect(20);

  var localSourceTransforms = 0,
      restSourceTransforms = 0;

  restSource.on('didTransform', function(transform) {
    restSourceTransforms++;

    var operation = transform.operations[0];
    equal(transform.operations.length, 1, 'rest source - one operation');

    // console.log('REST SOURCE - didTransform', restSourceTransforms, operation);

    if (restSourceTransforms === 1) {
      ok(operation.value.__id,                           'orbit id should be defined');
      equal(operation.value.name, 'Jupiter',             'name should match');
      equal(operation.value.classification, 'gas giant', 'classification should match');

    } else if (restSourceTransforms === 2) {
      equal(operation.op, 'replace',   'rest source - id updated');
      equal(operation.value, '12345',  'rest source - id');

    } else {
      ok(false, 'too many transforms');
    }
  });

  localSource.on('didTransform', function(transform) {
    localSourceTransforms++;

    var operation = transform.operations[0];
    equal(transform.operations.length, 1, 'local source - one operation');

    // console.log('LOCAL SOURCE - didTransform', localSourceTransforms, operation, inverse);

    if (localSourceTransforms === 1) {
      equal(operation.op, 'add',                         'local source - initial object addition');
      equal(operation.value.name, 'Jupiter',             'local source - inserted - name - Jupiter');
      equal(operation.value.classification, 'gas giant', 'local source - inserted - classification should be original');

    } else if (localSourceTransforms === 2) {
      start();

      // `id` is added when the REST POST response returns
      equal(operation.op, 'replace',   'local source - id updated');
      equal(operation.value, '12345',  'local source - id');

    } else {
      ok(false, 'too many transforms');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memorySource.length('planet'), 1,   'memory source should contain one record');
    ok(record.__id,                           'orbit id should be defined');
    equal(record.id, undefined,               'server id should NOT be defined yet');
    equal(record.name, 'Jupiter',             'name should match');
    equal(record.classification, 'gas giant', 'classification should match');

  }).then(function() {
    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({data: {type: 'planets', id: '12345', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
    });
  });
});

test("records updated in memory should be updated with rest", function() {
  expect(40);

  var memorySourceTransforms = 0,
      localSourceTransforms = 0,
      restSourceTransforms = 0;

  memorySource.on('didTransform', function(transform) {
    memorySourceTransforms++;

    var operations = transform.operations;

    // console.log('MEMORY SOURCE - didTransform', memorySourceTransforms, operations);

    if (memorySourceTransforms === 1) {
      equal(operations.length, 1,                            'memory source - one operation');
      equal(operations[0].op, 'add',                         'memory source - initial object addition');
      equal(operations[0].value.name, 'Jupiter',             'memory source - inserted - name - Jupiter');
      equal(operations[0].value.classification, 'gas giant', 'memory source - inserted - classification should be original');

    } else if (memorySourceTransforms === 2) {
      equal(operations.length, 1,                            'memory source - one operation');
      equal(operations[0].op, 'replace',                     'memory source - planet replaced');
      equal(operations[0].value.name, 'Earth',               'memory source - planet name - Earth');
      equal(operations[0].value.classification, 'gas giant', 'memory source - classification should be unchanged');

    } else if (memorySourceTransforms === 3) {
      // `id` is added when the REST POST response returns
      equal(operations.length, 1,           'memory source - one operations');
      equal(operations[0].op, 'replace',    'memory source - id updated');
      equal(operations[0].value, '12345',   'memory source - id');

    } else {
      ok(false, 'memory source - too many transforms');
    }
  });

  restSource.on('didTransform', function(transform) {
    restSourceTransforms++;

    var operations = transform.operations;

    // console.log('REST SOURCE - didTransform', restSourceTransforms, operations);

    if (restSourceTransforms === 1) {
      equal(operations.length, 1,                            'rest source - one operation');
      equal(operations[0].op, 'add',                         'rest source - initial object addition');
      equal(operations[0].value.name, 'Jupiter',             'rest source - inserted - name - Jupiter');
      equal(operations[0].value.classification, 'gas giant', 'rest source - inserted - classification - gas giant');

      setTimeout(function() {
        server.respond('PATCH', '/planets/12345', function(xhr) {
          deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', id: '12345', attributes: {name: 'Earth'}}}, 'PATCH request');
          xhr.respond(200,
            {'Content-Type': 'application/json'},
            JSON.stringify({}));
        });
      }, 0);

    } else if (restSourceTransforms === 2) {
      equal(operations.length, 1,         'rest source - one operation');
      equal(operations[0].op, 'replace',  'rest source - id updated');
      equal(operations[0].value, '12345', 'rest source - id');

    } else if (restSourceTransforms === 3) {
      start();
      equal(operations.length, 1,                            'rest source - one operation');
      equal(operations[0].op, 'replace',                     'rest source - record updated');
      equal(operations[0].value.name, 'Earth',               'rest source - name');
      equal(operations[0].value.classification, 'gas giant', 'rest source - classification');

    } else  {
      ok(false, 'rest source - too many transforms');
    }
  });

  localSource.on('didTransform', function(transform) {
    localSourceTransforms++;

    var operations = transform.operations;

    // console.log('LOCAL SOURCE - didTransform', localSourceTransforms, operations);

    if (localSourceTransforms === 1) {
      equal(operations.length, 1,                            'local source - one operation');
      equal(operations[0].op, 'add',                         'local source - initial object addition');
      equal(operations[0].value.name, 'Jupiter',             'local source - inserted - name - Jupiter');
      equal(operations[0].value.classification, 'gas giant', 'local source - inserted - classification should be original');

    } else if (localSourceTransforms === 2) {
      equal(operations.length, 1,         'local source - one operation');
      equal(operations[0].op, 'replace',                     'local source - record updated');
      equal(operations[0].value.name, 'Earth',               'local source - name');
      equal(operations[0].value.classification, 'gas giant', 'local source - classification');

    } else if (localSourceTransforms === 3) {
      // `id` is added when the REST POST response returns
      equal(operations.length, 1,           'local source - two operation');
      equal(operations[0].op, 'replace',    'local source - id updated');
      equal(operations[0].value, '12345',   'local source - id');

    } else {
      ok(false, 'local source - too many transforms');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memorySource.length('planet'), 1,    'memory source - inserted - should contain one record');
    ok(record.__id,                           'memory source - inserted - orbit id should be defined');
    equal(record.id, undefined,               'memory source - inserted - server id should NOT be defined yet');
    equal(record.name, 'Jupiter',             'memory source - inserted - name - Jupiter');
    equal(record.classification, 'gas giant', 'memory source - inserted - classification - gas giant');

    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({data: {type: 'planets', id: '12345', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
    });

    record = clone(record);
    record.name = 'Earth';
    return memorySource.update('planet', record);
  });
});

test("records patched in memory should be patched with rest", function() {
  expect(37);

  var memorySourceTransforms = 0,
      localSourceTransforms = 0,
      restSourceTransforms = 0;

  memorySource.on('didTransform', function(transform) {
    memorySourceTransforms++;

    // console.log('MEMORY SOURCE - didTransform', memorySourceTransforms, transform);

    var operations = transform.operations;

    if (memorySourceTransforms === 1) {
      equal(operations.length, 1,                            'memory source - one operation');
      equal(operations[0].op, 'add',                         'memory source - initial object addition');
      equal(operations[0].value.name, 'Jupiter',             'memory source - inserted - name - Jupiter');
      equal(operations[0].value.classification, 'gas giant', 'memory source - inserted - classification should be original');

    } else if (memorySourceTransforms === 2) {
      equal(operations.length, 1,         'memory source - one operation');
      equal(operations[0].op, 'replace',  'memory source - name replaced');
      equal(operations[0].value, 'Earth', 'memory source - name - Earth');

    } else if (memorySourceTransforms === 3) {
      // `id` is added when the REST POST response returns
      equal(operations.length, 1,          'memory source - one operation');
      equal(operations[0].op, 'replace',   'memory source - id updated');
      equal(operations[0].value, '12345',  'memory source - id');

    } else {
      ok(false, 'memory source - too many transforms');
    }
  });

  restSource.on('didTransform', function(transform) {
    restSourceTransforms++;

    // console.log('REST SOURCE - didTransform', restSourceTransforms, transform);

    var operations = transform.operations;

    if (restSourceTransforms === 1) {
      equal(operations.length, 1,                            'rest source - one operation');
      equal(operations[0].op, 'add',                         'rest source - initial object addition');
      equal(operations[0].value.name, 'Jupiter',             'rest source - inserted - name - Jupiter');
      equal(operations[0].value.classification, 'gas giant', 'rest source - inserted - classification - gas giant');

      setTimeout(function() {
        server.respond('PATCH', '/planets/12345', function(xhr) {
          deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', id: '12345', attributes: {name: 'Earth'}}}, 'PUT request');
          xhr.respond(200,
            {'Content-Type': 'application/json'},
            JSON.stringify({}));
        });
      }, 0);

    } else if (restSourceTransforms === 2) {
      equal(operations.length, 1,         'rest source - one operation');
      equal(operations[0].op, 'replace',  'rest source - id updated');
      equal(operations[0].value, '12345', 'rest source - id');

    } else if (restSourceTransforms === 3) {
      start();
      equal(operations.length, 1,         'rest source - one operation');
      equal(operations[0].op, 'replace',  'rest source - name replaced');
      equal(operations[0].value, 'Earth', 'rest source - name - Earth');

    } else  {
      ok(false, 'rest source - too many transforms');
    }
  });

  localSource.on('didTransform', function(transform) {
    localSourceTransforms++;

    // console.log('LOCAL SOURCE - didTransform', localSourceTransforms, operation, inverse);

    var operations = transform.operations;

    if (localSourceTransforms === 1) {
      equal(operations.length, 1,                            'local source - one operation');
      equal(operations[0].op, 'add',                         'local source - initial object addition');
      equal(operations[0].value.name, 'Jupiter',             'local source - inserted - name - Jupiter');
      equal(operations[0].value.classification, 'gas giant', 'local source - inserted - classification should be original');

    } else if (localSourceTransforms === 2) {
      equal(operations.length, 1,         'local source - one operation');
      equal(operations[0].op, 'replace',  'local source - name replaced');
      equal(operations[0].value, 'Earth', 'local source - name - Earth');

    } else if (localSourceTransforms === 3) {
      // `id` is added when the REST POST response returns
      equal(operations.length, 1,           'local source - one operation');
      equal(operations[0].op, 'replace',    'local source - id updated');
      equal(operations[0].value, '12345',   'local source - id');

    } else {
      ok(false, 'local source - too many transforms');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(record) {
    equal(memorySource.length('planet'), 1,   'memory source - inserted - should contain one record');
    ok(record.__id,                           'memory source - inserted - orbit id should be defined');
    equal(record.id, undefined,               'memory source - inserted - server id should NOT be defined yet');
    equal(record.name, 'Jupiter',             'memory source - inserted - name - Jupiter');
    equal(record.classification, 'gas giant', 'memory source - inserted - classification - gas giant');

    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({data: {type: 'planets', id: '12345', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
    });

    return memorySource.patch('planet', record.__id, 'name', 'Earth');
  });
});

test("records deleted in memory should be deleted with rest", function() {
  expect(24);

  var memorySourceTransforms = 0,
      localSourceTransforms = 0,
      restSourceTransforms = 0;

  server.autoRespond = true;

  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  memorySource.on('didTransform', function(transform) {
    memorySourceTransforms++;

    // console.log('MEMORY SOURCE - didTransform', memorySourceTransforms, transform);

    var operations = transform.operations;

    if (memorySourceTransforms === 1) {
      equal(operations.length, 1,                'memory source - one operation');
      equal(operations[0].op, 'add',             'memory source - initial object addition');

    } else if (memorySourceTransforms === 2) {
      equal(operations.length, 1,                'memory source - one operation');
      equal(operations[0].op, 'remove',          'memory source - removed');
      equal(memorySource.length('planet'), 0,    'memory source should be empty');

    } else if (memorySourceTransforms === 3) {
      equal(operations.length, 1,                'memory source - one operation');
      equal(operations[0].op, 'replace',         'memory source - replaced');

    } else {
      ok(false, 'memory source - too many transforms');
    }
  });

  restSource.on('didTransform', function(transform) {
    restSourceTransforms++;

    // console.log('REST SOURCE - didTransform', restSourceTransforms, transform);

    var operations = transform.operations;

    if (restSourceTransforms === 1) {
      equal(operations.length, 1,                'rest source - one operation');
      equal(operations[0].op, 'add',             'rest source - initial object addition');

    } else if (restSourceTransforms === 2) {
      equal(operations.length, 1,                'rest source - one operation');
      equal(operations[0].op, 'replace',         'rest source - id updated');
      equal(operations[0].value, '12345',        'rest source - id');

    } else if (restSourceTransforms === 3) {
      start();
      equal(operations.length, 1,                'rest source - one operation');
      equal(operations[0].op, 'remove',          'rest source - removed');

    } else  {
      ok(false, 'rest source - too many transforms');
    }
  });

  localSource.on('didTransform', function(transform) {
    localSourceTransforms++;

    // console.log('LOCAL SOURCE - didTransform', localSourceTransforms, transform);

    var operations = transform.operations;

    if (localSourceTransforms === 1) {
      equal(operations.length, 1,                'local source - one operation');
      equal(operations[0].op, 'add',             'local source - initial object addition');

    } else if (localSourceTransforms === 2) {
      equal(operations.length, 1,                'local source - one operation');
      equal(operations[0].op, 'remove',          'local source - removed');
      equal(localSource.length('planet'), 0,     'local source should be empty');

    } else if (localSourceTransforms === 3) {
      equal(operations.length, 1,                'local source - one operation');
      equal(operations[0].op, 'replace',         'local source - replaced');

    } else {
      ok(false, 'local source - too many transforms');
    }
  });

  /////////////////////////////////////////////////////////////////////////////

  stop();
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(memorySource.length('planet'), 1, 'memory source - inserted - should contain one record');

    server.respond('POST', '/planets', function(xhr) {
      deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}, 'POST request');
      xhr.respond(201,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({data: {type: 'planets', id: '12345', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
    });

    return memorySource.remove('planet', planet.__id);
  });
});
