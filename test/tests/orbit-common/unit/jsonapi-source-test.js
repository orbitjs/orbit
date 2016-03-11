import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import JSONAPISource from 'orbit-common/jsonapi-source';
import { Promise } from 'rsvp';
import jQuery from 'jquery';
import { toIdentifier, parseIdentifier } from 'orbit-common/lib/identifiers';
import { queryExpression as oqe } from 'orbit/query/expression';

let server,
    schema,
    source;

///////////////////////////////////////////////////////////////////////////////

module('OC - JSONAPISource', {
  setup() {
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
            name: { type: 'string' },
            classification: { type: 'string' }
          },
          relationships: {
            moons: { type: 'hasMany', model: 'moon', inverse: 'planet' }
          }
        },
        moon: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
          }
        }
      }
    });

    source = new JSONAPISource({ schema: schema });

    source.serializer.resourceKey = function() { return 'remoteId'; };
  },

  teardown() {
    schema = null;
    source = null;

    server.restore();
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('its prototype chain is correct', function(assert) {
  assert.ok(source instanceof Source, 'instanceof Source');
});

test('implements Fetchable', function(assert) {
  assert.ok(source._fetchable, 'implements Fetchable');
  assert.ok(typeof source.fetch === 'function', 'has `fetch` method');
});

test('implements Transformable', function(assert) {
  assert.ok(source._transformable, 'implements Transformable');
  assert.ok(typeof source.transformed === 'function', 'has `transformed` method');
});

test('implements Updatable', function(assert) {
  assert.ok(source._updatable, 'implements Updatable');
  assert.ok(typeof source.update === 'function', 'has `update` method');
});

test('source saves options', function(assert) {
  assert.expect(6);
  let schema = new Schema({});
  source = new JSONAPISource({ schema: schema, host: '127.0.0.1:8888', namespace: 'api', headers: { 'User-Agent': 'CERN-LineMode/2.15 libwww/2.17b3' } });
  assert.equal(source.namespace, 'api', 'Namespace should be defined');
  assert.equal(source.host, '127.0.0.1:8888', 'Host should be defined');
  assert.equal(source.headers['User-Agent'], 'CERN-LineMode/2.15 libwww/2.17b3', 'Headers should be defined');
  assert.equal(source.resourceNamespace(), source.namespace, 'Default namespace should be used by default');
  assert.equal(source.resourceHost(), source.host, 'Default host should be used by default');
  assert.deepEqual(source.ajaxHeaders(), source.headers, 'Default headers should be used by default');
});

test('#resourcePath - returns resource\'s path without its host and namespace', function(assert) {
  assert.expect(1);
  source.host = 'http://127.0.0.1:8888';
  source.namespace = 'api';
  let jupiter = schema.normalize({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

  assert.equal(source.resourcePath('planet', '1'), 'planets/a', 'resourcePath returns the path to the resource relative to the host and namespace');
});

test('#resourceURL - respects options to construct URLs', function(assert) {
  assert.expect(1);
  source.host = 'http://127.0.0.1:8888';
  source.namespace = 'api';
  let jupiter = schema.normalize({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

  assert.equal(source.resourceURL('planet', '1'), 'http://127.0.0.1:8888/api/planets/a', 'resourceURL method should use the options to construct URLs');
});

test('#resourceRelationshipURL - constructs relationship URLs based upon base resourceURL', function(assert) {
  assert.expect(1);
  let jupiter = schema.normalize({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

  assert.equal(source.resourceRelationshipURL('planet', '1', 'moons'), '/planets/a/relationships/moons', 'resourceRelationshipURL appends /relationships/[relationship] to resourceURL');
});

test('#update - can add records', function(assert) {
  assert.expect(4);

  let transformCount = 0;

  let planet = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  let addPlanetOp = {
    op: 'addRecord',
    record: {
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
          data: {}
        }
      }
    }
  };

  let addPlanetRemoteIdOp = {
    op: 'replaceKey',
    record: { type: 'planet', id: planet.id },
    key: 'remoteId',
    value: '12345'
  };

  server.respondWith('POST', '/planets', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          relationships: {
            moons: {
              data: []
            }
          }
        }
      },
      'POST request');
    xhr.respond(201,
                { 'Content-Type': 'application/json' },
                JSON.stringify({ data: { id: '12345', type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } } }));
  });

  source.on('transform', function(transform) {
    transformCount++;

    if (transformCount === 1) {
      assert.deepEqual(
        transform.operations,
        [addPlanetOp],
        'transform event initially returns add-record op'
      );
    } else if (transformCount === 2) {
      // Remote ID is added as a separate operation
      assert.deepEqual(
        transform.operations,
        [addPlanetRemoteIdOp],
        'transform event then returns add-remote-id op'
      );
    }
  });

  return source.update(t => t.addRecord(planet))
    .then(function() {
      assert.ok(true, 'update resolves successfully');
    });
});

test('#update - can update records', function(assert) {
  expect(3);

  let transformCount = 0;

  let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' }, attributes: { name: 'Jupiter', classification: 'gas giant' } });

  let replacePlanetOp = {
    op: 'replaceRecord',
    record: {
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
          data: {}
        }
      }
    }
  };

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          id: '12345',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          relationships: {
            moons: {
              data: []
            }
          }
        }
      },
      'PATCH request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({ data: { id: '12345', type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } } }));
  });

  source.on('transform', function(transform) {
    transformCount++;

    if (transformCount === 1) {
      assert.deepEqual(
        transform.operations,
        [replacePlanetOp],
        'transform event initially returns replace-record op'
      );
    }
  });

  return source.update(t => t.replaceRecord(planet))
    .then(() => {
      assert.ok(true, 'transform resolves successfully');
    });
});

test('#update - can replace a single attribute', function(assert) {
  assert.expect(2);

  let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' }, attributes: { name: 'Jupiter', classification: 'gas giant' } });

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
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.update(t => { t.replaceAttribute(planet, 'classification', 'terrestrial'); })
    .then(() => {
      assert.ok(true, 'record patched');
    });
});

test('#update - can delete records', function(assert) {
  assert.expect(2);

  let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' } });

  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.update(t => t.removeRecord(planet))
    .then(() => {
      assert.ok(true, 'record deleted');
    });
});

test('#update - can add a hasMany relationship with POST', function(assert) {
  assert.expect(2);

  let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' } });
  let moon = schema.normalize({ type: 'moon', keys: { remoteId: '987' } });

  server.respondWith('POST', '/planets/12345/relationships/moons', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), { data: [{ type: 'moons', id: '987' }] },
              'POST request to add relationship to primary record');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.update(t => { t.addToHasMany(planet, 'moons', moon); })
    .then(() => {
      assert.ok(true, 'records linked');
    });
});

test('#update - can remove a relationship with DELETE', function(assert) {
  expect(2);

  let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' } });
  let moon = schema.normalize({ type: 'moon', keys: { remoteId: '987' } });

  server.respondWith('DELETE', '/planets/12345/relationships/moons', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), { data: [{ type: 'moons', id: '987' }] },
              'DELETE request to remove relationship from primary record');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.update(t => { t.removeFromHasMany(planet, 'moons', moon); })
    .then(function() {
      assert.ok(true, 'records unlinked');
    });
});

test('#update - can update a hasOne relationship with PATCH', function(assert) {
  assert.expect(2);

  let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' } });
  let moon = schema.normalize({ type: 'moon', keys: { remoteId: '987' } });

  server.respondWith('PATCH', '/moons/987', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      { data: { type: 'moons', id: '987', relationships: { planet: { data: { type: 'planets', id: '12345' } } } } },
      'PATCH request to add relationship to primary record');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.update(t => { t.replaceHasOne(moon, 'planet', planet); })
    .then(function() {
      assert.ok(true, 'relationship replaced');
    });
});

test('#update - can clear a hasOne relationship with PATCH', function(assert) {
  assert.expect(2);

  let moon = schema.normalize({ type: 'moon', keys: { remoteId: '987' } });

  server.respondWith('PATCH', '/moons/987', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      { data: { type: 'moons', id: '987', relationships: { planet: { data: null } } } },
      'PATCH request to replace relationship');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.update(t => { t.replaceHasOne(moon, 'planet', null); })
    .then(function() {
      assert.ok(true, 'relationship replaced');
    });
});

test('#update - can replace a hasMany relationship with PATCH', function(assert) {
  expect(2);

  let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' } });
  let moon = schema.normalize({ type: 'moon', keys: { remoteId: '987' } });

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      { data: { type: 'planets', id: '12345', relationships: { moons: { data: [{ type: 'moons', id: '987' }] } } } },
      'PATCH request to replace relationship');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.update(t => { t.replaceHasMany(planet, 'moons', [moon]); })
    .then(function() {
      assert.ok(true, 'relationship replaced');
    });
});

// test('#query - can `get` an individual record', function() {
//   expect(5);
//
//   let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' } });
//
//   server.respondWith('GET', '/planets/12345', function(xhr) {
//     ok(true, 'GET request');
//     xhr.respond(200,
//                 { 'Content-Type': 'application/json' },
//                 JSON.stringify({ data: { id: '12345', type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } } }));
//   });
//
//   stop();
//   source.query(oqe('get', `planet/${planet.id}`))
//     .then(function(foundPlanet) {
//       start();
//       equal(foundPlanet.id, planet.id, 'orbit id should match');
//       equal(foundPlanet.keys.remoteId, '12345', 'remote id should be defined');
//       equal(foundPlanet.attributes.name, 'Jupiter', 'name should match');
//       equal(foundPlanet.attributes.classification, 'gas giant', 'classification should match');
//     });
// });

// test('#query - `findRecord` can return a compound document including related records', function() {
//   expect(6);
//
//   let planet = schema.normalize({ type: 'planet', keys: { remoteId: '12345' } });
//
//   let payload = {
//     data: {
//       id: '12345',
//       type: 'planets',
//       attributes: {
//         name: 'Jupiter',
//         classification: 'gas giant'
//       },
//       relationships: {
//         moons: { data: [{ type: 'moons', id: '5' }] }
//       }
//     },
//     included: [{
//       id: '5',
//       type: 'moons',
//       attributes: {
//         name: 'Io'
//       },
//       relationships: {
//         planet: { data: { type: 'planets', id: '12345' } }
//       }
//     }]
//   };
//
//   server.respondWith('GET', '/planets/12345', function(xhr) {
//     ok(true, 'GET request');
//     xhr.respond(200,
//                 { 'Content-Type': 'application/json' },
//                 JSON.stringify(payload));
//   });
//
//   stop();
//   source.query({ findRecord: {
//     type: 'planet',
//     id: planet.id
//   } })
//     .then(function(foundPlanet) {
//       start();
//
//       equal(foundPlanet.id, planet.id, 'orbit id should match');
//       equal(foundPlanet.keys.remoteId, '12345', 'remote id should be defined');
//       equal(foundPlanet.attributes.name, 'Jupiter', 'name should match');
//       equal(foundPlanet.attributes.classification, 'gas giant', 'classification should match');
//
//       let moons = Object.keys(foundPlanet.relationships.moons.data);
//       equal(moons.length, 1, 'planet should have a single moon');
//     });
// });
//
// test('#query - `findRecordsByType` can find all records', function() {
//   expect(13);
//
//   let records = [
//     { type: 'planets', id: '1', attributes: { name: 'Jupiter', classification: 'gas giant' } },
//     { type: 'planets', id: '2', attributes: { name: 'Earth', classification: 'terrestrial' } },
//     { type: 'planets', id: '3', attributes: { name: 'Saturn', classification: 'gas giant' } }
//   ];
//
//   server.respondWith('GET', '/planets', function(xhr) {
//     ok(true, 'GET request');
//     xhr.respond(200,
//                 { 'Content-Type': 'application/json' },
//                 JSON.stringify({ data: records }));
//   });
//
//   stop();
//   source.query({ findRecordsByType: { type: 'planet' } })
//     .then(function(planets) {
//       start();
//
//       let planet, record;
//       for (let i = 0; i < planets.length; i++) {
//         planet = planets[i];
//         record = records[i];
//         ok(planet.id, 'orbit id should be defined');
//         equal(planet.keys.remoteId, record.id, 'remote id should be defined');
//         equal(planet.attributes.name, record.attributes.name, 'name should match');
//         equal(planet.attributes.classification, record.attributes.classification, 'classification should match');
//       }
//     });
// });
//
// test('#query - `filterRecordsByType` can filter records by type and attributes', function() {
//   expect(14);
//
//   let records = [
//     { type: 'planets', id: '1', attributes: { name: 'Mercury', classification: 'terrestrial' } },
//     { type: 'planets', id: '2', attributes: { name: 'Venus', classification: 'terrestrial' } },
//     { type: 'planets', id: '3', attributes: { name: 'Earth', classification: 'terrestrial' } }
//   ];
//
//   server.respondWith(function(xhr) {
//     equal(xhr.method, 'GET', 'GET request');
//     equal(xhr.url, '/planets?' + encodeURIComponent('filter[classification]') + '=terrestrial', 'request to correct URL');
//     xhr.respond(200,
//                 { 'Content-Type': 'application/json' },
//                 JSON.stringify({ data: records }));
//   });
//
//   stop();
//   source.query({ filterRecordsByType: { type: 'planet', filter: { classification: 'terrestrial' } } })
//     .then(function(planets) {
//       start();
//
//       let planet, record;
//       for (let i = 0; i < planets.length; i++) {
//         planet = planets[i];
//         record = records[i];
//         ok(planet.id, 'orbit id should be defined');
//         equal(planet.keys.remoteId, record.id, 'remote id should be defined');
//         equal(planet.attributes.name, record.attributes.name, 'name should match');
//         equal(planet.attributes.classification, record.attributes.classification, 'classification should match');
//       }
//     });
// });
//
// test("#query - `findRelationship` can find has-many linked ids", function() {
//   expect(11);
//
//   let moonRecords = [
//     {type: 'moons', id: '1'},
//     {type: 'moons', id: '3'},
//     {type: 'moons', id: '6'}
//   ];
//
//   let planetRecord = {
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
//   source.query({findRecord: {
//     type: 'planet',
//     id: planetRecord.id
//   }})
//     .then(function(planet) {
//       source.query({
//         findRelationship: {
//           type: 'planet',
//           id: planet.id,
//           relationship: 'moons'
//         }
//       })
//         .then(function(moonIds) {
//           start();
//
//           equal(moonIds.length, 3, 'there should be 3 moons');
//           for (let i = 0; i < moonIds.length; i++) {
//             equal(moonIds[i].type, 'moon', 'type should match');
//             ok(moonIds[i].id, 'id should be assigned');
//           }
//         });
//     });
// });
//
// test("#findLinked - can find has-many linked values", function() {
//   expect(14);
//
//   let moonRecords = [
//     {type: 'moons', id: '1', attributes: {name: 'Moon 1'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}},
//     {type: 'moons', id: '3', attributes: {name: 'Moon 2'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}},
//     {type: 'moons', id: '6', attributes: {name: 'Moon 3'}, relationships: {planet: {data: {type: 'planets', id: '1'}}}}
//   ];
//
//   let planetRecord = {
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
//       let moon, record;
//       for (let i = 0; i < moons.length; i++) {
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
//   let planetRecord = {
//     type: 'planets',
//     id: '1'
//   };
//
//   let moonRecord = {
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
