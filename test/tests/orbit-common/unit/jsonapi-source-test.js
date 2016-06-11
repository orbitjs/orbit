import Source from 'orbit/source';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import KeyMap from 'orbit-common/key-map';
import JSONAPISource from 'orbit-common/jsonapi-source';
import qb from 'orbit-common/query/builder';
import { TransformNotAllowed } from 'orbit-common/lib/exceptions';
import {
  addRecord,
  replaceRecord,
  removeRecord,
  // replaceKey,
  replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  replaceHasMany,
  replaceHasOne
} from 'orbit-common/transform/operators';

let server, keyMap, source;

///////////////////////////////////////////////////////////////////////////////

module('OC - JSONAPISource - with a secondary key', {
  setup() {
    // fake xhr
    server = sinon.fakeServer.create();
    server.autoRespond = true;

    let schema = new Schema({
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

    keyMap = new KeyMap();
    source = new JSONAPISource({ schema, keyMap });

    source.serializer.resourceKey = function() { return 'remoteId'; };
  },

  teardown() {
    keyMap = null;
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
  assert.ok(typeof source.transform === 'function', 'has `transform` method');
});

test('source saves options', function(assert) {
  assert.expect(6);
  let schema = new Schema({});
  source = new JSONAPISource({ schema, keyMap, host: '127.0.0.1:8888', namespace: 'api', headers: { 'User-Agent': 'CERN-LineMode/2.15 libwww/2.17b3' } });
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
  keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

  assert.equal(source.resourcePath('planet', '1'), 'planets/a', 'resourcePath returns the path to the resource relative to the host and namespace');
});

test('#resourceURL - respects options to construct URLs', function(assert) {
  assert.expect(1);
  source.host = 'http://127.0.0.1:8888';
  source.namespace = 'api';
  keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

  assert.equal(source.resourceURL('planet', '1'), 'http://127.0.0.1:8888/api/planets/a', 'resourceURL method should use the options to construct URLs');
});

test('#resourceRelationshipURL - constructs relationship URLs based upon base resourceURL', function(assert) {
  assert.expect(1);
  keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

  assert.equal(source.resourceRelationshipURL('planet', '1', 'moons'), '/planets/a/relationships/moons', 'resourceRelationshipURL appends /relationships/[relationship] to resourceURL');
});

test('#ajaxHeaders - include JSONAPI Accept header by default', function(assert) {
  assert.deepEqual(source.ajaxHeaders(), { Accept: 'application/vnd.api+json' }, 'Default headers should include JSONAPI Accept header');
});

test('#transform - can add records', function(assert) {
  assert.expect(4);

  let transformCount = 0;

  let planet = source.serializer.deserializeRecord({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

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

  return source.transform(addRecord(planet))
    .then(function() {
      assert.ok(true, 'transform resolves successfully');
    });
});

test('#transform - can transform records', function(assert) {
  expect(3);

  let transformCount = 0;

  let planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

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

  return source.transform(replaceRecord(planet))
    .then(() => {
      assert.ok(true, 'transform resolves successfully');
    });
});

test('#transform - can replace a single attribute', function(assert) {
  assert.expect(2);

  let planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

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

  return source.transform(replaceAttribute(planet, 'classification', 'terrestrial'))
    .then(() => {
      assert.ok(true, 'record patched');
    });
});

test('#transform - can delete records', function(assert) {
  assert.expect(2);

  let planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345'
  });

  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.transform(removeRecord(planet))
    .then(() => {
      assert.ok(true, 'record deleted');
    });
});

test('#transform - can add a hasMany relationship with POST', function(assert) {
  assert.expect(2);

  let planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345'
  });

  let moon = source.serializer.deserializeRecord({
    type: 'moon',
    id: '987'
  });

  server.respondWith('POST', '/planets/12345/relationships/moons', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), { data: [{ type: 'moons', id: '987' }] },
              'POST request to add relationship to primary record');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.transform(addToHasMany(planet, 'moons', moon))
    .then(() => {
      assert.ok(true, 'records linked');
    });
});

test('#transform - can remove a relationship with DELETE', function(assert) {
  expect(2);

  let planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345'
  });

  let moon = source.serializer.deserializeRecord({
    type: 'moon',
    id: '987'
  });

  server.respondWith('DELETE', '/planets/12345/relationships/moons', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), { data: [{ type: 'moons', id: '987' }] },
              'DELETE request to remove relationship from primary record');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.transform(removeFromHasMany(planet, 'moons', moon))
    .then(function() {
      assert.ok(true, 'records unlinked');
    });
});

test('#transform - can update a hasOne relationship with PATCH', function(assert) {
  assert.expect(2);

  let planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345'
  });

  let moon = source.serializer.deserializeRecord({
    type: 'moon',
    id: '987'
  });

  server.respondWith('PATCH', '/moons/987', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      { data: { type: 'moons', id: '987', relationships: { planet: { data: { type: 'planets', id: '12345' } } } } },
      'PATCH request to add relationship to primary record');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.transform(replaceHasOne(moon, 'planet', planet))
    .then(function() {
      assert.ok(true, 'relationship replaced');
    });
});

test('#transform - can clear a hasOne relationship with PATCH', function(assert) {
  assert.expect(2);

  let moon = source.serializer.deserializeRecord({
    type: 'moon',
    id: '987'
  });

  server.respondWith('PATCH', '/moons/987', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      { data: { type: 'moons', id: '987', relationships: { planet: { data: null } } } },
      'PATCH request to replace relationship');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.transform(replaceHasOne(moon, 'planet', null))
    .then(function() {
      assert.ok(true, 'relationship replaced');
    });
});

test('#transform - can replace a hasMany relationship with PATCH', function(assert) {
  assert.expect(2);

  let planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345'
  });

  let moon = source.serializer.deserializeRecord({
    type: 'moon',
    id: '987'
  });

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      { data: { type: 'planets', id: '12345', relationships: { moons: { data: [{ type: 'moons', id: '987' }] } } } },
      'PATCH request to replace relationship');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.transform(replaceHasMany(planet, 'moons', [moon]))
    .then(function() {
      assert.ok(true, 'relationship replaced');
    });
});

test('#transform - a single transform can result in multiple requests', function(assert) {
  assert.expect(3);

  let planet1 = source.serializer.initializeRecord({ type: 'planet', keys: { remoteId: '1' } });
  let planet2 = source.serializer.initializeRecord({ type: 'planet', keys: { remoteId: '2' } });

  server.respondWith('DELETE', '/planets/1', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  server.respondWith('DELETE', '/planets/2', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({}));
  });

  return source.transform([
    removeRecord(planet1),
    removeRecord(planet2)
  ])
    .then(() => {
      assert.ok(true, 'record deleted');
    });
});

test('#transform - source can limit the number of allowed requests per transform with `maxRequestsPerTransform`', function(assert) {
  assert.expect(1);

  let planet1 = source.serializer.initializeRecord({ type: 'planet', keys: { remoteId: '1' } });
  let planet2 = source.serializer.initializeRecord({ type: 'planet', keys: { remoteId: '2' } });

  source.maxRequestsPerTransform = 1;

  return source.transform([
    removeRecord(planet1),
    removeRecord(planet2)
  ])
    .catch(e => {
      assert.ok(e instanceof TransformNotAllowed, 'TransformNotAllowed thrown');
    });
});

test('#fetch - record', function(assert) {
  assert.expect(4);

  const data = { type: 'planets', id: '12345', attributes: { name: 'Jupiter', classification: 'gas giant' } };

  const planet = source.serializer.deserializeRecord({
    type: 'planet',
    id: '12345'
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    assert.ok(true, 'GET request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({ data }));
  });

  return source.fetch(qb.record({ type: 'planet', id: planet.id }))
    .then(transforms => {
      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceRecord']);
      assert.deepEqual(transforms[0].operations.map(o => o.record.attributes.name), ['Jupiter']);
    });
});

test('#fetch - records', function(assert) {
  assert.expect(4);

  const data = [
    { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } },
    { type: 'planets', attributes: { name: 'Earth', classification: 'terrestrial' } },
    { type: 'planets', attributes: { name: 'Saturn', classification: 'gas giant' } }
  ];

  server.respondWith('GET', '/planets', function(xhr) {
    assert.ok(true, 'GET request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({ data }));
  });

  return source.fetch(qb.records('planet'))
    .then(transforms => {
      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceRecord', 'replaceRecord', 'replaceRecord']);
      assert.deepEqual(transforms[0].operations.map(o => o.record.attributes.name), ['Jupiter', 'Earth', 'Saturn']);
    });
});

test('#fetch - records with filter', function(assert) {
  assert.expect(4);

  const data = [
    { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
  ];

  server.respondWith('GET', `/planets?${encodeURIComponent('filter[name]')}=Jupiter`, function(xhr) {
    assert.ok(true, 'GET request');
    xhr.respond(200,
                { 'Content-Type': 'application/json' },
                JSON.stringify({ data }));
  });

  return source.fetch(qb.records('planet')
                        .filterAttributes({ name: 'Jupiter' }))
    .then(transforms => {
      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceRecord']);
      assert.deepEqual(transforms[0].operations.map(o => o.record.attributes.name), ['Jupiter']);
    });
});

module('OC - JSONAPISource - with no secondary keys', {
  setup() {
    // fake xhr
    server = sinon.fakeServer.create();
    server.autoRespond = true;

    let schema = new Schema({
      modelDefaults: {
        id: {
          defaultValue: uuid
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

    keyMap = new KeyMap();
    source = new JSONAPISource({ schema, keyMap });
  },

  teardown() {
    keyMap = null;
    source = null;

    server.restore();
  }
});

test('#transform - can add records', function(assert) {
  assert.expect(3);

  let transformCount = 0;

  let planet = source.serializer.deserializeRecord({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

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
      relationships: {
        moons: {
          data: {}
        }
      }
    }
  };

  server.respondWith('POST', '/planets', function(xhr) {
    assert.deepEqual(JSON.parse(xhr.requestBody),
      {
        data: {
          type: 'planets',
          id: planet.id,
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
                JSON.stringify({ data: { id: planet.id, type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } } }));
  });

  source.on('transform', function(transform) {
    transformCount++;

    if (transformCount === 1) {
      assert.deepEqual(
        transform.operations,
        [addPlanetOp],
        'transform event initially returns add-record op'
      );
    }
  });

  return source.transform(addRecord(planet))
    .then(function() {
      assert.ok(true, 'transform resolves successfully');
    });
});
