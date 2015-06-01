import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import JSONAPISource from 'orbit-common/jsonapi-source';
import { Promise } from 'rsvp';
import jQuery from 'jquery';

var server,
    schema,
    source;

///////////////////////////////////////////////////////////////////////////////

module("OC - JSONAPISource", {
  setup: function() {
    Orbit.Promise = Promise;
    Orbit.ajax = jQuery.ajax;

    // fake xhr
    server = sinon.fakeServer.create();
    server.autoRespond = true;

    schema = new Schema({
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
    schema = null;
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
  expect(6);
  var schema = new Schema({});
  source = new JSONAPISource(schema, {host: "127.0.0.1:8888", namespace: "api", headers: {"User-Agent": "CERN-LineMode/2.15 libwww/2.17b3"}});
  equal(source.namespace, "api", "Namespace should be defined");
  equal(source.host, "127.0.0.1:8888", "Host should be defined");
  equal(source.headers["User-Agent"], "CERN-LineMode/2.15 libwww/2.17b3", "Headers should be defined");
  equal(source.resourceNamespace(), source.namespace, "Default namespace should be used by default");
  equal(source.resourceHost(), source.host, "Default host should be used by default");
  deepEqual(source.ajaxHeaders(), source.headers, "Default headers should be used by default");
});

test("#resourcePath - returns resource's path without its host and namespace", function () {
  expect(1);
  source = new JSONAPISource(schema, {host: "http://127.0.0.1:8888", namespace: "api"});

  var jupiter = source.normalize('planet', {id: '1', name: 'Jupiter'});
  equal(source.resourcePath("planet", jupiter.__id), 'planets/1', "resourcePath returns the path to the resource relative to the host and namespace");
});

test("#resourceURL - respects options to construct URLs", function () {
  expect(1);
  source = new JSONAPISource(schema, {host: "http://127.0.0.1:8888", namespace: "api"});

  var jupiter = source.normalize('planet', {id: '1', name: 'Jupiter'});
  equal(source.resourceURL("planet", jupiter.__id), 'http://127.0.0.1:8888/api/planets/1', "resourceURL method should use the options to construct URLs");
});

test("#resourceLinkURL - constructs relationship URLs based upon base resourceURL", function () {
  expect(1);

  var jupiter = source.normalize('planet', {id: '1', name: 'Jupiter'});
  equal(source.resourceLinkURL('planet', jupiter.__id, 'moons'), '/planets/1/relationships/moons', "resourceLinkURL appends /relationships/[relationship] to resourceURL");
});

test("#add - can insert records", function() {
  expect(5);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          relationships: {
            moons: { data: [] }
          }
        }
      },
      'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
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

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          id: '12345',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          relationships: {
            moons: { data: [] }
          }
        }
      },
      'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
  });

  stop();
  var data = {id: '12345', name: 'Jupiter', classification: 'gas giant'};
  source.update('planet', data).then(function() {
    start();
    var planetId = source.getId('planet', data);
    var planet = source.retrieve(['planet', planetId]);
    equal(planet.__id, planetId, 'orbit id should be defined');
    equal(planet.id, '12345', 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
  });
});

test("#patch - can patch records", function() {
  expect(2);

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          id: '12345',
          attributes: {
            classification: 'gas giant'
          }
        }
      },
      'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.patch('planet', {id: "12345"}, 'classification', 'gas giant').then(function() {
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
  source.remove('planet', {id: '12345'}).then(function() {
    start();
    ok(true, 'record deleted');
  });
});

test("#addLink - can add a hasMany relationship with POST", function() {
  expect(2);

  server.respondWith('POST', '/planets/12345/relationships/moons', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: [{type: 'moons', id: '987'}]},
              'POST request to add link to primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.addLink('planet', {id: '12345'}, 'moons', {id: '987'}).then(function() {
    start();
    ok(true, 'records linked');
  });
});

test("#addLink - can update a hasOne relationship with PATCH", function() {
  expect(2);

  server.respondWith('PATCH', '/moons/987/relationships/planet', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', id: '12345'}},
              'PATCH request to add link to primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.addLink('moon', {id: '987'}, 'planet', {id: '12345'}).then(function() {
    start();
    ok(true, 'records linked');
  });
});

test("#removeLink - can remove a relationship with DELETE", function() {
  expect(2);

  server.respondWith('DELETE', '/planets/12345/relationships/moons', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: [{type: 'moons', id: '987'}]},
              'DELETE request to remove link from primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.removeLink('planet', {id: '12345'}, 'moons', {id: '987'}).then(function() {
    start();
    ok(true, 'records unlinked');
  });
});

test("#updateLink - can replace a hasOne relationship with PATCH", function() {
  expect(2);

  server.respondWith('PATCH', '/moons/987/relationships/planet', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', id: '12345'}},
              'PATCH request to replace link');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.updateLink('moon', {id: '987'}, 'planet', {id: '12345'}).then(function() {
    start();
    ok(true, 'records linked');
  });
});

test("#updateLink - can replace a hasMany relationship (flagged as `actsAsSet`) with PATCH", function() {
  expect(2);

  // Moons link must be flagged with `actsAsSet`
  source.schema.models.planet.links.moons.actsAsSet = true;

  server.respondWith('PATCH', '/planets/12345/relationships/moons', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: [{type: 'moons', id: '987'}]},
              'PATCH request to replace link');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.updateLink('planet', {id: '12345'}, 'moons', [{id: '987'}]).then(function() {
    start();
    ok(true, 'records linked');
  });
});

test("#find - can find individual records by passing in a single id", function() {
  expect(6);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          relationships: {
            moons: { data: [] }
          }
        }
      },
      'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
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
    data: {
      id: '12345',
      type: 'planets',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {data: [{type: 'moons', id: '5'}]}
      }
    },
    included: [{
      id: '5',
      type: 'moons',
      attributes: {
        name: 'Io'
      },
      relationships: {
        planet: {data: {type: 'planets', id: '12345'}}
      }
    }]
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

// JSON API no longer explicitly supports URLs that represent multiple individual resources
//
// test("#find - can find an array of records from an array of ids", function() {
//   expect(4);
//
//   var jupiter = source.normalize('planet', {id: '1', name: 'Jupiter'});
//   var earth = source.normalize('planet', {id: '2', name: 'Earth'});
//
//   server.respondWith('GET', '/planets/1,2', function(xhr) {
//     ok(true, 'GET request');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({planets: [{id: '1', name: 'Jupiter'},
//                                           {id: '2', name: 'Earth'}]}));
//   });
//
//   stop();
//   source.find('planet', [jupiter.__id, earth.__id]).then(function(planets) {
//     start();
//     equal(planets.length, 2, 'two planets should be returned');
//     ok(planets[0].id, '1', 'server id should match');
//     ok(planets[1].id, '2', 'server id should match');
//   });
// });
//
// test("#find - can find an array of records from an array containing a single id", function() {
//   expect(3);
//
//   var jupiter = source.normalize('planet', {id: '1', name: 'Jupiter'});
//
//   server.respondWith('GET', '/planets/1', function(xhr) {
//     ok(true, 'GET request');
//     xhr.respond(200,
//       {'Content-Type': 'application/json'},
//       JSON.stringify({planets: {id: '1', name: 'Jupiter'}}));
//   });
//
//   stop();
//   source.find('planet', [jupiter.__id]).then(function(planets) {
//     start();
//     equal(planets.length, 1, 'one planets should be returned in an array');
//     ok(planets[0].id, '1', 'server id should match');
//   });
// });
//
// test("#find - can find an array of records from an array of remote ids", function() {
//   expect(4);
//
//   server.respondWith('GET', '/planets/1,2', function(xhr) {
//     ok(true, 'GET request');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({planets: [{id: '1', name: 'Jupiter'},
//                                           {id: '2', name: 'Earth'}]}));
//   });
//
//   stop();
//   source.find('planet', [{id: '1'}, {id: '2'}]).then(function(planets) {
//     start();
//     equal(planets.length, 2, 'two planets should be returned');
//     ok(planets[0].id, '1', 'server id should match');
//     ok(planets[1].id, '2', 'server id should match');
//   });
// });

test("#find - can find individual records by passing in a single remote id", function() {
  expect(6);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          relationships: {
            moons: { data: [] }
          }
        }
      },
      'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
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
    {type: 'planets', id: '1', attributes: {name: 'Jupiter', classification: 'gas giant'}},
    {type: 'planets', id: '2', attributes: {name: 'Earth', classification: 'terrestrial'}},
    {type: 'planets', id: '3', attributes: {name: 'Saturn', classification: 'gas giant'}}
  ];

  server.respondWith('GET', '/planets', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: records}));
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
      equal(planet.name, record.attributes.name, 'name should match');
      equal(planet.classification, record.attributes.classification, 'classification should match');
    }
  });
});

test("#find - can filter records", function() {
  expect(18);

  var records = [
    {type: 'planets', id: '1', attributes: {name: 'Mercury', classification: 'terrestrial'}},
    {type: 'planets', id: '2', attributes: {name: 'Venus', classification: 'terrestrial'}},
    {type: 'planets', id: '3', attributes: {name: 'Earth', classification: 'terrestrial'}},
    {type: 'planets', id: '4', attributes: {name: 'Mars', classification: 'terrestrial'}}
  ];

  server.respondWith(function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/planets?' + encodeURIComponent('filter[classification]') + '=terrestrial', 'request to correct URL');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: records}));
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
      equal(planet.name, record.attributes.name, 'name should match');
      equal(planet.classification, record.attributes.classification, 'classification should match');
    }
  });
});

test("#findLink - can find has-many linked ids", function() {
  expect(11);

  var moonRecords = [
    {type: 'moons', id: '1'},
    {type: 'moons', id: '3'},
    {type: 'moons', id: '6'}
  ];

  var planetRecord = {
    id: '1',
    type: 'planets',
    attributes: {
      name: 'Mercury',
      classification: 'terrestrial',
    },
    relationships: {
      moons: {
        data: moonRecords
      }
    }
  };

  server.respondWith('GET', '/planets/1', function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/planets/1', 'request to correct resource URL');
    xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: planetRecord}));
  });

  server.respondWith('GET', '/planets/1/relationships/moons', function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/planets/1/relationships/moons', 'request to correct relationship URL');
    xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: moonRecords}));
  });

  stop();
  source.find('planet', {id: '1'}).then(function(planet) {
    source.findLink('planet', planet, 'moons').then(function(moonIds) {
      start();

      equal(moonIds.length, 3, 'there should be 3 moons');
      for (var i = 0; i < moonIds.length; i++) {
        equal(moonIds[i].type, 'moon', 'type should match');
        ok(moonIds[i].id, 'id should be assigned');
      }
    });
  });
});

test("#findLinked - can find has-many linked values", function() {
  expect(14);

  var moonRecords = [
    {type: 'moons', id: '1', attributes: {name: 'Moon 1'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}},
    {type: 'moons', id: '3', attributes: {name: 'Moon 2'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}},
    {type: 'moons', id: '6', attributes: {name: 'Moon 3'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}}
  ];

  var planetRecord = {
    id: '1',
    type: 'planets',
    attributes: {
      name: 'Mercury',
      classification: 'terrestrial',
    },
    relationships: {
      moons: {
        data: [
          {type: 'moons', id: '1'},
          {type: 'moons', id: '3'},
          {type: 'moons', id: '6'}
        ]
      }
    }
  };

  server.respondWith('GET', '/planets/1', function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/planets/1', 'request to correct resource URL');
    xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: planetRecord}));
  });

  server.respondWith('GET', '/planets/1/moons', function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/planets/1/moons', 'request to correct related resource URL');
    xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: moonRecords}));
  });

  stop();
  source.find('planet', {id: '1'}).then(function(planet) {
    source.findLinked('planet', planet, 'moons').then(function(moons) {
      start();
      equal(moons.length, 3, 'there should be 3 moons');
      var moon, record;
      for (var i = 0; i < moons.length; i++) {
        moon = moons[i];
        record = moonRecords[i];
        ok(moon.__id, 'orbit id should be defined');
        equal(moon.id, record.id, 'server id should be defined');
        equal(moon.name, record.attributes.name, 'name should match');
      }
    });
  });
});

test("#findLink - can find has-one linked values", function() {
  expect(6);

  var planetRecord = {
    type: 'planets',
    id: '1'
  };

  var moonRecord = {
    id: '1',
    type: 'moons',
    attributes: {
      name: 'Moon 1'
    },
    relationships: {
      planet: '1'
    }
  };

  server.respondWith('GET', '/moons/1', function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/moons/1', 'request to correct URL');
    xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: moonRecord}));

  });

  server.respondWith('GET', '/moons/1/relationships/planet', function(xhr) {
    equal(xhr.method, 'GET', 'GET request');
    equal(xhr.url, '/moons/1/relationships/planet', 'request to correct URL');
    xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: planetRecord}));
  });

  stop();
  source.find('moon', {id: '1'}).then(function(moon) {
    source.findLink('moon', moon, 'planet').then(function(planetId) {
      start();
      ok(planetId.id, 'orbit id should be defined');
      equal(planetId.type, 'planet', 'type should match');
    });
  });
});
