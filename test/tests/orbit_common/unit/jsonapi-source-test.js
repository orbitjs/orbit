import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import JSONAPISource from 'orbit-common/jsonapi-source';
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

test("its prototype chain is correct", function() {
  ok(source instanceof Source, 'instanceof Source');
});

test("source saves options", function() {
  expect(3);
  var schema = new Schema({});
  source = new JSONAPISource(schema, {host: "127.0.0.1:8888", namespace: "api", headers: {"User-Agent": "CERN-LineMode/2.15 libwww/2.17b3"}});
  equal(source.namespace, "api", "Namespace should be defined");
  equal(source.host, "127.0.0.1:8888", "Host should be defined");
  equal(source.headers["User-Agent"], "CERN-LineMode/2.15 libwww/2.17b3", "Headers should be defined");
});

test("#buildURL - respects options to construct URLs", function () {
  expect(1);
  var schema = new Schema({});
  source = new JSONAPISource(schema, {host: "127.0.0.1:8888", namespace: "api"});
  equal(source.buildURL("planet", 1), '127.0.0.1:8888/api/planets/1', "buildURL method should use the options to construct URLs");
});

test("#add - can insert records", function() {
  expect(5);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {planets: {name: 'Jupiter', classification: 'gas giant', links: {moons: []}}}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({planets: {id: 12345, name: 'Jupiter', classification: 'gas giant'}}));
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
    deepEqual(JSON.parse(xhr.requestBody), {planets: {id: 12345, name: 'Jupiter', classification: 'gas giant', links: {moons: []}}}, 'PUT request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({planets: {id: 12345, name: 'Jupiter', classification: 'gas giant'}}));
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
    deepEqual(JSON.parse(xhr.requestBody), {planets: {name: 'Jupiter', classification: 'gas giant', links: {moons: []}}}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({planets: {id: 12345, name: 'Jupiter', classification: 'gas giant'}}));
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({planets: {id: 12345, name: 'Jupiter', classification: 'gas giant'}}));
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

test("#find - can return a compound document including related records", function() {
  expect(7);

  var payload = {
    planets: {id: '12345', name: 'Jupiter', classification: 'gas giant', links: {moons: ['5']}},
    linked: {
      moons: [{id: '5', name: 'Io', links: {planet: '12345'}}]
    }
  };

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify(payload));
  });

  stop();
  source.find('planet', {id: '12345'}).then(function(planet) {
    start();

    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, '12345', 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    var moons = Object.keys(planet.__rel.moons);
    equal(moons.length, 1, 'planet should have a single moon');

    var moon = source.retrieve(['moon', moons[0]]); 
    equal(moon.__rel.planet, planet.__id, 'moon should be assigned to planet');
  });
});

test("#find - can find an array of records from an array of ids", function() {
  expect(4);

  var jupiter = source.normalize('planet', {id: '1', name: 'Jupiter'});
  var earth = source.normalize('planet', {id: '2', name: 'Earth'});

  server.respondWith('GET', '/planets/1,2', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({planets: [{id: '1', name: 'Jupiter'},
                                          {id: '2', name: 'Earth'}]}));
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
                JSON.stringify({planets: [{id: '1', name: 'Jupiter'},
                                          {id: '2', name: 'Earth'}]}));
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
    deepEqual(JSON.parse(xhr.requestBody), {planets: {name: 'Jupiter', classification: 'gas giant', links: {moons: []}}}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({planets: {id: 12345, name: 'Jupiter', classification: 'gas giant'}}));
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({planets: {id: 12345, name: 'Jupiter', classification: 'gas giant'}}));
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
                JSON.stringify({planets: records}));
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
                JSON.stringify({planets: records}));
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

test("#findLink - can find has-many linked values", function() {
  expect(5);

  var planetRecord = {id: 1, name: 'Mercury', classification: 'terrestrial', moons:[1,3,6]};
  var moonRecords = [
    {id: 1, name: 'Moon 1', planet: 1},
    {id: 3,  name: 'Moon 2', planet: 1},
    {id: 6,  name: 'Moon 3', planet: 1}
  ];
  server.respondWith(function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/planets/1', 'request to correct URL');
    xhr.respond(200,{'Content-Type': 'application/json'},JSON.stringify({planets: planetRecord}));
    server.respondWith(function(xhr) {
      equal(xhr.method, 'GET', 'GET request');
      equal(xhr.url, '/moons/1,3,6', 'request to correct URL');
      xhr.respond(200,{'Content-Type': 'application/json'},JSON.stringify({moons: moonRecords}));
    });
  });

  stop();
  source.find('planet', 1).then(function(planet) {
    planet.get('moon').find().then(function(moons){
      start();
      equal(moons.length, 3, 'there should be 3 moons');
      var moon, record;
      for (var i = 0; i < moons.length; i++) {
        moon = moons[i];
        record = moonRecords[i];
        ok(moon.__id, 'orbit id should be defined');
        equal(moon.id, record.id, 'server id should be defined');
        equal(moon.name, record.name, 'name should match');
      }
    });
  });
});

test("#findLink - can find has-one linked values", function() {
  expect(4);

  var planetRecord = {id: 1, name: 'Mercury', classification: 'gas giant', moons:[1,3,6]};
  var moonRecord = {id: 1, name: 'Moon 1', planet: 1};
  server.respondWith(function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/moons/1', 'request to correct URL');
    xhr.respond(200,{'Content-Type': 'application/json'},JSON.stringify({planets: planetRecord}));
    server.respondWith(function(xhr) {
      equal(xhr.method, 'GET', 'GET request');
      equal(xhr.url, '/planets/1', 'request to correct URL');
      xhr.respond(200,{'Content-Type': 'application/json'},JSON.stringify({moons: moonRecord}));
    });
  });

  stop();

  source.find('moon', 1).then(function(moon) {
    moon.get('planet').find().then(function(planet){
      start();
      ok(planet.__id, 'orbit id should be defined');
      equal(planet.id, 1, 'server id should be defined');
      equal(planet.name, 'Mercury', 'name should match');
      equal(planet.classification, 'gas giant', 'classification should match');
    });
  });
});
