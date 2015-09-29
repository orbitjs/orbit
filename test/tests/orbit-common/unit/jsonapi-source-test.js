import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import JSONAPISource from 'orbit-common/jsonapi-source';
import { Promise } from 'rsvp';
import jQuery from 'jquery';
import { toOperation } from 'orbit/lib/operations';
import { toIdentifier, parseIdentifier } from 'orbit-common/lib/identifiers';
import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToRelationshipOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
} from 'orbit-common/lib/operations';
import { equalOps } from 'tests/test-helper';

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
        id: {
          defaultValue: uuid
        },
        keys: {
          remoteId: {}
        }
      },
      models: {
        planet: {
          attributes: {
            name: {type: 'string'},
            classification: {type: 'string'}
          },
          relationships: {
            moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
          }
        },
        moon: {
          attributes: {
            name: {type: 'string'}
          },
          relationships: {
            planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
          }
        }
      }
    });

    source = new JSONAPISource({schema: schema});

    source.serializer.resourceKey = function() { return 'remoteId'; };
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
  source = new JSONAPISource({schema: schema, host: "127.0.0.1:8888", namespace: "api", headers: {"User-Agent": "CERN-LineMode/2.15 libwww/2.17b3"}});
  equal(source.namespace, "api", "Namespace should be defined");
  equal(source.host, "127.0.0.1:8888", "Host should be defined");
  equal(source.headers["User-Agent"], "CERN-LineMode/2.15 libwww/2.17b3", "Headers should be defined");
  equal(source.resourceNamespace(), source.namespace, "Default namespace should be used by default");
  equal(source.resourceHost(), source.host, "Default host should be used by default");
  deepEqual(source.ajaxHeaders(), source.headers, "Default headers should be used by default");
});

test("#resourcePath - returns resource's path without its host and namespace", function () {
  expect(1);
  source.host = 'http://127.0.0.1:8888';
  source.namespace = 'api';
  var jupiter = source.normalize({type: 'planet', id: '1', keys: {remoteId: 'a'}, attributes: {name: 'Jupiter'}});

  equal(source.resourcePath('planet', '1'), 'planets/a', 'resourcePath returns the path to the resource relative to the host and namespace');
});

test("#resourceURL - respects options to construct URLs", function () {
  expect(1);
  source.host = 'http://127.0.0.1:8888';
  source.namespace = 'api';
  var jupiter = source.normalize({type: 'planet', id: '1', keys: {remoteId: 'a'}, attributes: {name: 'Jupiter'}});

  equal(source.resourceURL('planet', '1'), 'http://127.0.0.1:8888/api/planets/a', 'resourceURL method should use the options to construct URLs');
});

test("#resourceRelationshipURL - constructs relationship URLs based upon base resourceURL", function () {
  expect(1);
  var jupiter = source.normalize({type: 'planet', id: '1', keys: {remoteId: 'a'}, attributes: {name: 'Jupiter'}});

  equal(source.resourceRelationshipURL('planet', '1', 'moons'), '/planets/a/relationships/moons', "resourceRelationshipURL appends /relationships/[relationship] to resourceURL");
});

test("#transform - can add records", function() {
  expect(4);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        }
      },
      'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
  });

  var transformCount = 0;

  var planet = schema.normalize({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}});

  var addPlanetOp = toOperation('add', ['planet', planet.id], {
    __normalized: true,
    type: 'planet',
    id: planet.id,
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    keys: {
      remoteId: undefined
    },
    relationships: {
      moons: {
        data: undefined
      }
    }
  });

  var addPlanetRemoteIdOp = toOperation('add', ['planet', planet.id, 'keys', 'remoteId'], '12345');

  source.on('didTransform', function(transform) {
    transformCount++;

    if (transformCount === 1) {
      equalOps(
        transform.operations,
        [ addPlanetOp ],
        'didTransform initially returns add-record op'
      );

    } else if (transformCount === 2) {
      // Remote ID is added as a separate operation
      start();
      equalOps(
        transform.operations,
        [ addPlanetRemoteIdOp ],
        'didTransform then returns add-remote-id op'
      );
    }
  });

  stop();

  source.transform(addRecordOperation(planet))
    .then(function(result) {
      equalOps(
        result.operations,
        [ addPlanetOp, addPlanetRemoteIdOp ],
        'transform returns result containing both add-record and add-remote-id ops'
      );
    });
});

test("#transform - can update records", function() {
  expect(5);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}, attributes: {name: 'Jupiter', classification: 'gas giant'}});

  var replacePlanetOp = toOperation('replace', ['planet', planet.id], {
    __normalized: true,
    type: 'planet',
    id: planet.id,
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    keys: {
      remoteId: '12345'
    },
    relationships: {
      moons: {
        data: undefined
      }
    }
  });

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          id: '12345',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        }
      },
      'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
  });

  stop();

  source.transform(replaceRecordOperation(planet))
    .then(function(result) {
      start();

      equalOps(
        result.operations,
        [ replacePlanetOp ],
        'transform returns result containing replace-record op'
      );

      var updatedPlanet = source.retrieve(['planet', planet.id]);
      equal(updatedPlanet.keys.remoteId, '12345', 'server id should be defined');
      equal(updatedPlanet.attributes.name, 'Jupiter', 'name should match');
      equal(updatedPlanet.attributes.classification, 'gas giant', 'classification should match');
    });
});

test("#transform - can replace attributes", function() {
  expect(2);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}, attributes: {name: 'Jupiter', classification: 'gas giant'}});

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          id: '12345',
          attributes: {
            classification: 'terrestrial'
          }
        }
      },
      'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();

  source.transform(replaceAttributeOperation(planet, 'classification', 'terrestrial'))
    .then(function() {
      start();
      ok(true, 'record patched');
    });
});

test("#transform - can delete records", function() {
  expect(2);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}});

  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.transform(removeRecordOperation(planet))
    .then(function() {
      start();
      ok(true, 'record deleted');
    });
});

test("#transform - can add a hasMany relationship with POST", function() {
  expect(2);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}});
  var moon = schema.normalize({type: 'moon', keys: {remoteId: '987'}});

  server.respondWith('POST', '/planets/12345/relationships/moons', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: [{type: 'moons', id: '987'}]},
              'POST request to add relationship to primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.transform(addToRelationshipOperation(planet, 'moons', moon))
    .then(function() {
      start();
      ok(true, 'records linked');
    });
});

test("#transform - can remove a relationship with DELETE", function() {
  expect(2);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}});
  var moon = schema.normalize({type: 'moon', keys: {remoteId: '987'}});

  server.respondWith('DELETE', '/planets/12345/relationships/moons', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: [{type: 'moons', id: '987'}]},
              'DELETE request to remove relationship from primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.transform(removeFromRelationshipOperation(planet, 'moons', moon))
    .then(function() {
      start();
      ok(true, 'records unlinked');
    });
});

test("#transform - can update a hasOne relationship with PATCH", function() {
  expect(2);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}});
  var moon = schema.normalize({type: 'moon', keys: {remoteId: '987'}});

  server.respondWith('PATCH', '/moons/987/relationships/planet', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: {type: 'planets', id: '12345'}},
              'PATCH request to add relationship to primary record');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.transform(replaceRelationshipOperation(moon, 'planet', planet))
    .then(function() {
      start();
      ok(true, 'relationship replaced');
    });
});

test("#transform - can clear a hasOne relationship with PATCH", function() {
  expect(2);

  var moon = schema.normalize({type: 'moon', keys: {remoteId: '987'}});

  server.respondWith('PATCH', '/moons/987/relationships/planet', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: null},
              'PATCH request to replace relationship');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.transform(replaceRelationshipOperation(moon, 'planet', null))
    .then(function() {
      start();
      ok(true, 'relationship replaced');
    });
});

test("#transform - can replace a hasMany relationship (flagged as `actsAsSet`) with PATCH", function() {
  expect(2);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}});
  var moon = schema.normalize({type: 'moon', keys: {remoteId: '987'}});

  // TODO - evaluate necessity of `actsAsSet`
  //
  // Moons link must be flagged with `actsAsSet`
  source.schema.models.planet.relationships.moons.actsAsSet = true;

  server.respondWith('PATCH', '/planets/12345/relationships/moons', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {data: [{type: 'moons', id: '987'}]},
              'PATCH request to replace relationship');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  source.transform(replaceRelationshipOperation(planet, 'moons', [moon]))
    .then(function() {
      start();
      ok(true, 'relationship replaced');
    });
});

test("#find - can find an individual record by passing in a single id", function() {
  expect(5);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}});

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({data: {id: '12345', type: 'planets', attributes: {name: 'Jupiter', classification: 'gas giant'}}}));
  });

  stop();
  source.find('planet', planet.id)
    .then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, planet.id, 'orbit id should match');
      equal(foundPlanet.keys.remoteId, '12345', 'remote id should be defined');
      equal(foundPlanet.attributes.name, 'Jupiter', 'name should match');
      equal(foundPlanet.attributes.classification, 'gas giant', 'classification should match');
    });
});

test("#find - can return a compound document including related records", function() {
  expect(7);

  var planet = schema.normalize({type: 'planet', keys: {remoteId: '12345'}});

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
  source.find('planet', planet.id)
    .then(function(foundPlanet) {
      start();

      equal(foundPlanet.id, planet.id, 'orbit id should match');
      equal(foundPlanet.keys.remoteId, '12345', 'remote id should be defined');
      equal(foundPlanet.attributes.name, 'Jupiter', 'name should match');
      equal(foundPlanet.attributes.classification, 'gas giant', 'classification should match');

      var moons = Object.keys(foundPlanet.relationships.moons.data);
      equal(moons.length, 1, 'planet should have a single moon');

      var moonIdentifier = parseIdentifier(moons[0]);
      var moon = source.retrieve([moonIdentifier.type, moonIdentifier.id]);
      equal(moon.relationships.planet.data, toIdentifier('planet', foundPlanet.id), 'moon should be assigned to planet');
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
      ok(planet.id, 'orbit id should be defined');
      equal(planet.keys.remoteId, record.id, 'remote id should be defined');
      equal(planet.attributes.name, record.attributes.name, 'name should match');
      equal(planet.attributes.classification, record.attributes.classification, 'classification should match');
    }
  });
});

// TODO - refactor find / query methods
//
// test("#query - can filter records", function() {
//   expect(14);
//
//   var records = [
//     {type: 'planets', id: '1', attributes: {name: 'Mercury', classification: 'terrestrial'}},
//     {type: 'planets', id: '2', attributes: {name: 'Venus', classification: 'terrestrial'}},
//     {type: 'planets', id: '3', attributes: {name: 'Earth', classification: 'terrestrial'}}
//   ];
//
//   server.respondWith(function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/planets?' + encodeURIComponent('filter[classification]') + '=terrestrial', 'request to correct URL');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({data: records}));
//   });
//
//   stop();
//   source.query('planet', {classification: 'terrestrial'}).then(function(planets) {
//     start();
//
//     var planet, record;
//     for (var i = 0; i < planets.length; i++) {
//       planet = planets[i];
//       record = records[i];
//       ok(planet.id, 'orbit id should be defined');
//       equal(planet.keys.remoteId, record.id, 'remote id should be defined');
//       equal(planet.attributes.name, record.attributes.name, 'name should match');
//       equal(planet.attributes.classification, record.attributes.classification, 'classification should match');
//     }
//   });
// });
//
// test("#findLink - can find has-many linked ids", function() {
//   expect(11);
//
//   var moonRecords = [
//     {type: 'moons', id: '1'},
//     {type: 'moons', id: '3'},
//     {type: 'moons', id: '6'}
//   ];
//
//   var planetRecord = {
//     id: '1',
//     type: 'planets',
//     attributes: {
//       name: 'Mercury',
//       classification: 'terrestrial',
//     },
//     relationships: {
//       moons: {
//         data: moonRecords
//       }
//     }
//   };
//
//   server.respondWith('GET', '/planets/1', function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/planets/1', 'request to correct resource URL');
//     xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: planetRecord}));
//   });
//
//   server.respondWith('GET', '/planets/1/relationships/moons', function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/planets/1/relationships/moons', 'request to correct relationship URL');
//     xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: moonRecords}));
//   });
//
//   stop();
//   source.find('planet', {id: '1'}).then(function(planet) {
//     source.findLink('planet', planet, 'moons').then(function(moonIds) {
//       start();
//
//       equal(moonIds.length, 3, 'there should be 3 moons');
//       for (var i = 0; i < moonIds.length; i++) {
//         equal(moonIds[i].type, 'moon', 'type should match');
//         ok(moonIds[i].id, 'id should be assigned');
//       }
//     });
//   });
// });
//
// test("#findLinked - can find has-many linked values", function() {
//   expect(14);
//
//   var moonRecords = [
//     {type: 'moons', id: '1', attributes: {name: 'Moon 1'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}},
//     {type: 'moons', id: '3', attributes: {name: 'Moon 2'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}},
//     {type: 'moons', id: '6', attributes: {name: 'Moon 3'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}}
//   ];
//
//   var planetRecord = {
//     id: '1',
//     type: 'planets',
//     attributes: {
//       name: 'Mercury',
//       classification: 'terrestrial',
//     },
//     relationships: {
//       moons: {
//         data: [
//           {type: 'moons', id: '1'},
//           {type: 'moons', id: '3'},
//           {type: 'moons', id: '6'}
//         ]
//       }
//     }
//   };
//
//   server.respondWith('GET', '/planets/1', function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/planets/1', 'request to correct resource URL');
//     xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: planetRecord}));
//   });
//
//   server.respondWith('GET', '/planets/1/moons', function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/planets/1/moons', 'request to correct related resource URL');
//     xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: moonRecords}));
//   });
//
//   stop();
//   source.find('planet', {id: '1'}).then(function(planet) {
//     source.findLinked('planet', planet, 'moons').then(function(moons) {
//       start();
//       equal(moons.length, 3, 'there should be 3 moons');
//       var moon, record;
//       for (var i = 0; i < moons.length; i++) {
//         moon = moons[i];
//         record = moonRecords[i];
//         ok(moon.__id, 'orbit id should be defined');
//         equal(moon.id, record.id, 'server id should be defined');
//         equal(moon.name, record.attributes.name, 'name should match');
//       }
//     });
//   });
// });
//
// test("#findLink - can find has-one linked values", function() {
//   expect(6);
//
//   var planetRecord = {
//     type: 'planets',
//     id: '1'
//   };
//
//   var moonRecord = {
//     id: '1',
//     type: 'moons',
//     attributes: {
//       name: 'Moon 1'
//     },
//     relationships: {
//       planet: '1'
//     }
//   };
//
//   server.respondWith('GET', '/moons/1', function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/moons/1', 'request to correct URL');
//     xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: moonRecord}));
//
//   });
//
//   server.respondWith('GET', '/moons/1/relationships/planet', function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/moons/1/relationships/planet', 'request to correct URL');
//     xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({data: planetRecord}));
//   });
//
//   stop();
//   source.find('moon', {id: '1'}).then(function(moon) {
//     source.findLink('moon', moon, 'planet').then(function(planetId) {
//       start();
//       ok(planetId.id, 'orbit id should be defined');
//       equal(planetId.type, 'planet', 'type should match');
//     });
//   });
// });
