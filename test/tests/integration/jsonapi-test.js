import { planetsSchema as schema } from 'tests/test-helper';
import Store from 'orbit-common/store';
import JsonApiSource from 'orbit-common/jsonapi-source';
import TransformQueue from 'orbit/transform/queue';
import { eq } from 'orbit/lib/eq';

let server;

const stubbedResponses = {
  planetAdded: [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ data: { type: 'planets', id: '12345', attributes: { name: 'Pluto', classification: 'gas giant' } } })
  ],
  planetAddFailed: [
    422,
    { 'Content-Type': 'application/json' },
    JSON.stringify(
      {
        'errors': [
          {
            status: 422,
            source: {
              pointer: 'data/attributes/name'
            },
            title: 'Invalid Attribute',
            detail: 'Pluto isn\'t really a planet!'
          }
        ]
      }
    )
  ],
  deletePlanet: [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({})
  ]
};

function onAddPlutoRequest(response) {
  server.respondWith('POST', '/planets', (xhr) => {
    const body = JSON.parse(xhr.requestBody);

    if (body.data.attributes.name === 'Pluto') {
      xhr.respond(...response);
    }
  });
}

function wasRequested(method, url, json) {
  const result = server.requests.find(request => {
    const methodMatches = request.method === method;
    const urlMatches = request.url === url;
    const jsonMatches = json ? eq(JSON.parse(request.requestBody), json) : true;
    return methodMatches && urlMatches && jsonMatches;
  });

  return !!result;
}

function jsonResponse(status, json) {
  return [
    status,
    { 'Content-Type': 'application/json' },
    JSON.stringify(json)
  ];
}

module('Integration - JSONAPI', function(hooks) {
  let store;
  let jsonApiSource;
  let queue;

  hooks.beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;

    jsonApiSource = new JsonApiSource({ schema: schema });
    store = new Store({ schema: schema });
    queue = new TransformQueue();

    store.on('transform', t => queue.add(t));
    queue.on('transform', t => jsonApiSource.update(t));
    jsonApiSource.on('transform', t => store.confirm(t));
    jsonApiSource.on('updateFail', (t, e) => store.deny(t, e));

    // store.on('transform', t => console.log('store.onTransform', t.id));
    // queue.on('transform', t => console.log('queue.onTransform', t.id));
    // jsonApiSource.on('transform', t => console.log('jsonApiSource', t.id));
    // jsonApiSource.on('updateFail', (t, e) => console.log('updateFail', t, e));

    store.on('fetch', expression => jsonApiSource.fetch(expression));
    window.store = store;
  });

  hooks.afterEach(function() {
    server.restore();
  });

  test('add record', function(assert) {
    const done = assert.async();

    onAddPlutoRequest(stubbedResponses.planetAdded);

    store.addRecord({ type: 'planet', attributes: { name: 'Pluto' } })
      .then(pluto => {
        assert.equal(pluto.attributes.name, 'Pluto', 'Attribute stored with record');
      })
      .finally(done);
  });

  test('add record error', function(assert) {
    const done = assert.async();

    onAddPlutoRequest(stubbedResponses.planetAddFailed);

    store.addRecord({ type: 'planet', attributes: { name: 'Pluto' } })
      .catch(error => {
        assert.equal(error.responseJSON.errors[0].detail, 'Pluto isn\'t really a planet!');
      })
      .finally(done);
  });

  test('replace record', function(assert) {
    const done = assert.async();

    store.cache.transform(t => {
      t.addRecord({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto', classification: 'superior' } });
    });

    server.respondWith('PATCH', '/planets/pluto', jsonResponse(200, {}));

    const requestBody = { 'data': { 'id': 'pluto', 'type': 'planets', 'attributes': { 'name': 'Pluto2', 'classification': 'gas giant' }, 'relationships': { 'moons': { 'data': [] } } } };

    store
      .replaceRecord({ type: 'planet', id: 'pluto', keys: { id: 'pluto' }, attributes: { name: 'Pluto2', classification: 'gas giant' } })
      .then(pluto => {
        assert.deepEqual(pluto.attributes, { name: 'Pluto2', classification: 'gas giant' }, 'replaced record');
        assert.ok(wasRequested('PATCH', '/planets/pluto', requestBody), 'server updated');
      })
      .finally(done);
  });

  test('remove record', function(assert) {
    const done = assert.async();
    const pluto = { type: 'planet', id: 'pluto' };

    server.respondWith('DELETE', '/planets/pluto', stubbedResponses.deletePlanet);

    store.cache.transform(t => t.addRecord(pluto));

    store
      .removeRecord(pluto)
      .then(() => {
        assert.notOk(store.cache.has(['planet', 'pluto']), 'cache updated');
        assert.ok(wasRequested('DELETE', '/planets/pluto'), 'server updated');
      })
      .finally(done);
  });

  QUnit.skip('replaceKey', function(assert) {
    const done = assert.async();

    store
      .replaceKey({ type: 'planet', id: 'pluto' }, 'remoteId', 'abc1234')
      .then(() => {
        const record = store.cache.get(['planet', 'pluto']);
        assert.equal(record.remoteId, 'abc1234', 'key updated on record');
        assert.ok(wasRequested(''));
      });
  });

  test('add record to hasMany', function(assert) {
    const done = assert.async();
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };

    store.cache.transform(t => {
      t.addRecord(jupiter);
      t.addRecord(io);
    });

    server.respondWith('POST', '/planets/jupiter/relationships/moons', jsonResponse(200, {}));

    store
      .addToHasMany(jupiter, 'moons', io)
      .then(() => {
        const cacheJupiter = store.cache.get(['planet', 'jupiter']);
        assert.deepEqual(cacheJupiter.relationships.moons.data, { 'moon:io': true }, 'cache updated');
        assert.ok(wasRequested('POST', '/planets/jupiter/relationships/moons'), 'server updated');
      })
      .finally(done);
  });

  test('remove record from hasMany', function(assert) {
    const done = assert.async();
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };

    store.cache.transform(t => {
      t.addRecord(jupiter);
      t.addRecord(io);
      t.addToHasMany(jupiter, 'moons', io);
    });

    server.respondWith('DELETE', '/planets/jupiter/relationships/moons', jsonResponse(200, {}));

    store
      .removeFromHasMany(jupiter, 'moons', io)
      .then(() => {
        const cacheJupiter = store.cache.get(['planet', 'jupiter']);
        assert.deepEqual(cacheJupiter.relationships.moons.data, {}, 'cache updated');
        assert.ok(wasRequested('DELETE', '/planets/jupiter/relationships/moons', { data: [{ type: 'moons', id: 'io' }] }), 'server updated');
      })
      .finally(done);
  });

  test('replace hasOne', function(assert) {
    const done = assert.async();
    const earth = { type: 'planet', id: 'earth' };
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const requestBody = { data: { id: 'io', type: 'moons', relationships: { planet: { data: { type: 'planets', id: 'earth' } } } } };

    store.cache.transform(t => {
      t.addRecord(earth);
      t.addRecord(jupiter);
      t.addRecord(io);
      t.replaceHasOne(io, 'planet', jupiter);
    });

    server.respondWith('PATCH', '/moons/io', jsonResponse(200, {}));

    store
      .replaceHasOne(io, 'planet', earth)
      .then(() => {
        const cacheIo = store.cache.get(['moon', 'io']);
        assert.deepEqual(cacheIo.relationships.planet.data, 'planet:earth', 'updated cache');
        assert.ok(wasRequested('PATCH', '/moons/io', requestBody), 'server updated');
      })
      .finally(done);
  });

  test('replace hasMany', function(assert) {
    const done = assert.async();
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const europa = { type: 'moon', id: 'europa' };
    const expectedRequestBody = { data: { id: 'jupiter', type: 'planets', relationships: { moons: { data: [{ type: 'moons', id: 'io' }, { type: 'moons', id: 'europa' }] } } } };

    store.cache.transform(t => {
      t.addRecord(jupiter);
      t.addRecord(io);
      t.addRecord(europa);
    });

    server.respondWith('PATCH', '/planets/jupiter', jsonResponse(200, {}));

    store
      .replaceHasMany(jupiter, 'moons', [io, europa])
      .then(() => {
        const cacheJupiter = store.cache.get(['planet', 'jupiter']);
        assert.deepEqual(cacheJupiter.relationships.moons.data, { 'moon:io': true, 'moon:europa': true });
        assert.ok(wasRequested('PATCH', '/planets/jupiter', expectedRequestBody), 'server updated');
      })
      .finally(done);
  });

  test('find records of a particular type', function(assert) {
    assert.expect(1);

    const data = [
      { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
    ];

    server.respondWith('GET', '/planets', jsonResponse(200, { data }));

    return store
      .query(q => q.recordsOfType('planet'))
      .then(planets => {
        assert.deepEqual(Object.keys(planets).map(k => planets[k].attributes.name), ['Jupiter']);
      });
  });

  test('find an individual record', function(assert) {
    assert.expect(3);

    const data = { type: 'planets', id: '12345', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    server.respondWith('GET', '/planets/12345', jsonResponse(200, { data }));

    return store
      .query(q => q.record('planet', '12345'))
      .then(record => {
        assert.equal(record.type, 'planet');
        assert.equal(record.id, '12345');
        assert.equal(record.attributes.name, 'Jupiter');
      });
  });

  test('find records of a particular type using a filter', function(assert) {
    assert.expect(1);

    const data = [
      { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
    ];

    server.respondWith('GET', `/planets?${encodeURIComponent('filter[name]')}=Jupiter`, jsonResponse(200, { data }));

    return store
      .query(q => q.recordsOfType('planet')
                   .filterAttributes({ name: 'Jupiter' }))
      .then(planets => {
        assert.deepEqual(Object.keys(planets).map(k => planets[k].attributes.name), ['Jupiter']);
      });
  });
});
