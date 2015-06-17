import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import JSONAPISource from 'orbit-common/jsonapi-source';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';
import jQuery from 'jquery';

var memorySource;
var restSource;

var memToRestConnector;
var restToMemConnector;

var server;

module("Integration - Rest / Memory Source Assist", {
  setup: function() {
    Orbit.Promise = Promise;
    Orbit.ajax = jQuery.ajax;

    // fake xhr
    server = sinon.fakeServer.create();
    server.autoRespond = true;

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
            planet: {type: 'hasOne', model: 'planet', inverse: 'moons'},
            mountains: {type: 'hasMany', model: 'mountain', inverse: 'moon'}
          }
        },
        mountain: {
          attributes: {
            name: {type: 'string'}
          },
          links: {
            moon: {type: 'hasOne', model: 'moon', inverse: 'mountains'}
          }
        }
      }
    });

    // Create sources
    memorySource = new MemorySource(schema);
    restSource = new JSONAPISource(schema);

    memorySource.id = 'memory';
    restSource.id = 'rest';

    // Create connectors
    memToRestConnector = new TransformConnector(memorySource, restSource);
    restToMemConnector = new TransformConnector(restSource, memorySource);
  },

  teardown: function() {
    memToRestConnector = restToMemConnector = null;
    memorySource = restSource = null;

    server.restore();
  }
});

test("multiple subsequent find requests", function() {
  expect(6);

  var planets = {
    "planets": [
      {
        "id": "1",
        "name": "Jupiter",
        "links": {
          "moons": ["2"]
        }
      }
    ]
  };
  server.respondWith('GET', '/planets', function(xhr) {
      ok(true, 'GET /planets request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify(planets));
  });

  var moons = {
    "moons": [
      {
        "id": "2",
        "name": "Io",
        "links": {
          "mountains": ["3"],
          "planet": "1"
        }
      }
    ]
  };
  server.respondWith('GET', '/moons', function(xhr) {
      ok(true, 'GET /moons request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify(moons));
  });

  var mountains = {
    "mountains": [
      {
        "id": "3",
        "name": "Danube Planum",
        "links": {
          "moon": "2"
        }
      }
    ]
  };
  server.respondWith('GET', '/mountains', function(xhr) {
      ok(true, 'GET /mountains request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify(mountains));
  });

  stop();

  memorySource.on('assistFind', function(type, id) {
    if (id === undefined) {
      return restSource.find.apply(restSource, arguments);
    }
  });

  memorySource.find("planet")
    .then(function(planets) {
      equal(planets.length, 1, 'found one planet');

      return memorySource.find("moon");
    })
    .then(function(moons) {
      equal(moons.length, 1, 'found one moon');

      return memorySource.find("mountain");
    })
    .then(function(mountains) {
      start();

      equal(mountains.length, 1, 'found one mountain');
    });
});

test("a single find request that returns a compound document", function() {
  expect(2);

  var planets = {
    "linked": {
      "mountains": [
        {
          "id": "3",
          "name": "Danube Planum",
          "links": {
            "moon": "2"
          }
        }
      ],
      "moons": [
        {
          "id": "2",
          "name": "Io",
          "links": {
            "mountains": ["3"]
          }
        }
      ]
    },
    "planets": [
      {
        "id": "1",
        "name": "Jupiter",
        "links": {
          "moons": ["2"]
        }
      }
    ]
  };
  server.respondWith('GET', '/planets', function(xhr) {
      ok(true, 'GET /planets request');
      xhr.respond(200,
                  {'Content-Type': 'application/json'},
                  JSON.stringify(planets));
  });

  memorySource.on('assistFind', function(type, id) {
    return restSource.find.apply(restSource, arguments);
  });

  stop();
  memorySource.find("planet").then(function(planets) {
    start();

    equal(planets.length, 1, 'found one planet');
  });
});

test("update record with an inverse relation", function() {
  expect(4);
  var planets = {
    "linked": {
      "moons": [
        {
          "id": "2",
          "name": "Io",
          "links": {
            "planet": "1"
          }
        }
      ]
    },
    "planets": [
      {
        "id": "1",
        "name": "Jupiter",
        "links": {
          "moons": ["2"]
        }
      }
    ]
  };

  server.respondWith(function(request) {
    if (request.method === 'GET' && request.url === '/planets') {
      ok(true, 'GET /planets request');
      request.respond(200,
                      {'Content-Type': 'application/json'},
                      JSON.stringify(planets));
    } else if (request.method === 'PUT' && request.url === '/planets/1') {
      ok(true, 'PUT /planets/1 request');
      request.respond(204, {}, "");
    } else {
      ok(false, request.method + ' ' + request.url + ' unexpected request');
    }
  });

  memorySource.on('assistFind', function(type, id) {
    return restSource.find.apply(restSource, arguments);
  });

  stop(2);
  memorySource.find("planet").then(function(planets) {
    equal(planets.length, 1, 'found one planet');
    start();

    var planet = planets[0];
    planet.classification = "Gas giant";

    memorySource.update("planet", planet).then(function() {
      ok(true, 'planet updated');
      start();
    });
  });
});
