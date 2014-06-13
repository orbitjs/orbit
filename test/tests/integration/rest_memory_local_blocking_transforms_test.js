import Orbit from 'orbit/main';
import Schema from 'orbit_common/schema';
import MemorySource from 'orbit_common/memory_source';
import JSONAPISource from 'orbit_common/jsonapi_source';
import LocalStorageSource from 'orbit_common/local_storage_source';
import TransformConnector from 'orbit/transform_connector';
import { Promise } from 'rsvp';
import { verifyLocalStorageContainsRecord } from 'test_helper';

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

    // Create schema
    var schema = new Schema({
      models: {
        planet: {}
      }
    });

    // Create sources
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

test("single records found with rest should be inserted into memory and local storage", function() {
  expect(4);
  server.respondWith('GET', '/planets/12345', function(xhr) {
      ok(true, 'GET request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });
  stop();
  restSource.find('planet', {id: '12345'}).then(function(planets) {
    start();
    equal(memorySource.length('planet'), 1, 'memory source cache size should == 1');
    equal(restSource.length('planet'), 1, 'rest source cache size should == 1');
    equal(localSource.length('planet'), 1, 'local source cache size should == 1');
  });
});

test("multiple records found with rest should be inserted into memory and local storage", function() {
  expect(4);
  server.respondWith('GET', '/planets', function(xhr) {
      ok(true, 'GET request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify([
                    {id: 12345, name: 'Jupiter', classification: 'gas giant'},
                    {id: 12346, name: 'Earth', classification: 'terrestrial'}
                  ]));
  });
  stop();
  restSource.find('planet').then(function(planets) {
    start();
    equal(memorySource.length('planet'), 2, 'memory source cache size should == 2');
    equal(restSource.length('planet'), 2, 'rest source cache size should == 2');
    equal(localSource.length('planet'), 2, 'local source cache size should == 2');
  });
});

test("if find is called mutiple times, the count of synced objects in the dbs should remain the same", function() {
  expect(5);
  server.respondWith('GET', '/planets', function(xhr) {
      ok(true, 'GET request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify([
                    {id: 12345, name: 'Jupiter', classification: 'gas giant'},
                    {id: 12346, name: 'Earth', classification: 'terrestrial'}
                  ]));
  });
  stop();
  restSource.find('planet').then(function(planets) {
    start();
    equal(memorySource.length('planet'), 2, 'memory source cache size should == 2'); //fails because size == 4
    equal(restSource.length('planet'), 2, 'rest source cache size should == 2'); //fails because size == 4
    equal(localSource.length('planet'), 2, 'local source cache size should == 2'); //fails because size == 4
  }).then(restSource.find('planet').then(function(planets) {
    console.log(planets); // 2 planets returned
    console.log(localSource.length('planet')); // size == 4
  }));
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
