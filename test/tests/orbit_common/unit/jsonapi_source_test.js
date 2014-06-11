import Orbit from 'orbit/main';
import Schema from 'orbit_common/schema';
import JSONAPISource from 'orbit_common/jsonapi_source';
import { Promise } from 'rsvp';

var server,
    source;

///////////////////////////////////////////////////////////////////////////////

module("OC - JSONAPISource", {
  setup: function() {
    Orbit.Promise = Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    var schema = new Schema({
      models: {
        planet: {
          attributes: {
            name: {type: 'string'},
            classification: {type: 'string'}
          },
          links: {
            moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
          }
        },
        moon: {
          attributes: {
            name: {type: 'string'}
          },
          links: {
            planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
          }
        }
      }
    });

    source = new JSONAPISource(schema);
  },

  teardown: function() {
    source = null;

    server.restore();
  }
});

test("it exists", function() {
  ok(source);
});

test("#add - can insert records", function() {
  expect(5);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant', links: {moons: []}}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
  });
});

test("#update - can update records", function() {
  expect(5);

  server.respondWith('PUT', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {id: 12345, name: 'Jupiter', classification: 'gas giant', links: {moons: []}}, 'PUT request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  source.update('planet', {id: 12345, name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
  });
});

test("#patch - can patch records", function() {
  expect(2);

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'replace', path: '/planets/12345/classification', value: 'gas giant'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.patch('planet', {id: 12345}, 'classification', 'gas giant').then(function() {
    start();
    ok(true, 'record patched');
  });
});

test("#remove - can delete records", function() {
  expect(2);

  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.remove('planet', {id: 12345}).then(function() {
    start();
    ok(true, 'record deleted');
  });
});

test("#addLink - can patch records with inverse relationships", function() {
  expect(3);

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'add', path: '/planets/12345/links/moons/-', value: 987},
              'PATCH request to add link to primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  server.respondWith('PATCH', '/moons/987', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'add', path: '/moons/987/links/planet', value: 12345},
              'PATCH request to add link to related record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.addLink('planet', {id: 12345}, 'moons', {id: 987}).then(function() {
    start();
    ok(true, 'records linked');
  });
});

test("#removeLink - can patch records with inverse relationships", function() {
  expect(3);

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'remove', path: '/planets/12345/links/moons/987'},
              'PATCH request to remove link from primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  server.respondWith('PATCH', '/moons/987', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {op: 'remove', path: '/moons/987/links/planet'},
              'PATCH request to remove link from related record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.removeLink('planet', {id: 12345}, 'moons', {id: 987}).then(function() {
    start();
    ok(true, 'records unlinked');
  });
});

test("#find - can find individual records by passing in a single id", function() {
  expect(6);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant', links: {moons: []}}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    source.find('planet', planet.__id).then(function(planet) {
      start();
      ok(planet.__id, 'orbit id should be defined');
      equal(planet.id, 12345, 'server id should be defined');
      equal(planet.name, 'Jupiter', 'name should match');
      equal(planet.classification, 'gas giant', 'classification should match');
    });
  });
});

test("#find - can find an array of records from an array of ids", function() {
  expect(4);

  var jupiter = {id: '1', name: 'Jupiter'},
      earth =   {id: '2', name: 'Earth'};

  source.initRecord('planet', jupiter);
  source.initRecord('planet', earth);

  server.respondWith('GET', '/planets/1,2', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify([{id: '1', name: 'Jupiter'},
                                {id: '2', name: 'Earth'}]));
  });

  stop();
  source.find('planet', [jupiter.__id, earth.__id]).then(function(planets) {
    start();
    equal(planets.length, 2, 'two planets should be returned');
    ok(planets[0].id, '1', 'server id should match');
    ok(planets[1].id, '2', 'server id should match');
  });
});

test("#find - can find an array of records from an array of remote ids", function() {
  expect(4);

  server.respondWith('GET', '/planets/1,2', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify([{id: '1', name: 'Jupiter'},
                                {id: '2', name: 'Earth'}]));
  });

  stop();
  source.find('planet', [{id: '1'}, {id: '2'}]).then(function(planets) {
    start();
    equal(planets.length, 2, 'two planets should be returned');
    ok(planets[0].id, '1', 'server id should match');
    ok(planets[1].id, '2', 'server id should match');
  });
});

test("#find - can find individual records by passing in a single remote id", function() {
  expect(6);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant', links: {moons: []}}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    source.find('planet', {id: planet.id}).then(function(planet) {
      start();
      ok(planet.__id, 'orbit id should be defined');
      equal(planet.id, 12345, 'server id should be defined');
      equal(planet.name, 'Jupiter', 'name should match');
      equal(planet.classification, 'gas giant', 'classification should match');
    });
  });
});

test("#find - can find all records", function() {
  expect(13);

  var records = [
    {id: 1, name: 'Jupiter', classification: 'gas giant'},
    {id: 2, name: 'Earth', classification: 'terrestrial'},
    {id: 3, name: 'Saturn', classification: 'gas giant'}
  ];

  server.respondWith('GET', '/planets', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify(records));
  });

  stop();
  source.find('planet').then(function(planets) {
    start();

    var planet, record;
    for (var i = 0; i < planets.length; i++) {
      planet = planets[i];
      record = records[i];
      ok(planet.__id, 'orbit id should be defined');
      equal(planet.id, record.id, 'server id should be defined');
      equal(planet.name, record.name, 'name should match');
      equal(planet.classification, record.classification, 'classification should match');
    }
  });
});

test("#find - can filter records", function() {
  expect(18);

  var records = [
    {id: 1, name: 'Mercury', classification: 'terrestrial'},
    {id: 2, name: 'Venus', classification: 'terrestrial'},
    {id: 3, name: 'Earth', classification: 'terrestrial'},
    {id: 4, name: 'Mars', classification: 'terrestrial'}
  ];

  server.respondWith(function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/planets?classification=terrestrial', 'request to correct URL');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify(records));
  });

  stop();
  source.find('planet', {classification: 'terrestrial'}).then(function(planets) {
    start();

    var planet, record;
    for (var i = 0; i < planets.length; i++) {
      planet = planets[i];
      record = records[i];
      ok(planet.__id, 'orbit id should be defined');
      equal(planet.id, record.id, 'server id should be defined');
      equal(planet.name, record.name, 'name should match');
      equal(planet.classification, record.classification, 'classification should match');
    }
  });
});
