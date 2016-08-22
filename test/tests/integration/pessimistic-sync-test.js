import Orbit from 'orbit';
import qb from 'orbit/query/builder';
import KeyMap from 'orbit/key-map';
import {
  addRecord,
  replaceRecord,
  removeRecord,
  // replaceKey,
  // replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  replaceHasMany,
  replaceHasOne
} from 'orbit/transform/operators';
import Store from 'orbit-store/store';
import JSONAPISource from 'orbit-jsonapi/jsonapi-source';
import LocalStorageSource from 'orbit-local-storage/local-storage-source';
import {
  verifyLocalStorageContainsRecord,
  verifyLocalStorageDoesNotContainRecord,
  jsonapiResponse,
  planetsSchema
} from 'tests/test-helper';

let fetchStub;

module('Integration - Pessimistic Sync', function(hooks) {
  let store;
  let backup;
  let remote;

  hooks.beforeEach(function() {
    fetchStub = sinon.stub(Orbit, 'fetch');

    let keyMap = new KeyMap();
    remote = new JSONAPISource({ schema: planetsSchema, keyMap: new KeyMap() });
    store = new Store({ schema: planetsSchema, keyMap });
    backup = new LocalStorageSource({ schema: planetsSchema, keyMap });

    store.on('beforeUpdate',
      transform => remote.push(transform)
                         .then(result => store.sync(result)));

    store.on('beforeQuery',
      query => remote.pull(query)
                     .then(result => store.sync(result)));

    store.on('transform', transform => backup.sync(transform));
  });

  hooks.afterEach(function() {
    backup.reset();

    store = backup = remote = null;

    fetchStub.restore();
  });

  test('#update - addRecord', function(assert) {
    assert.expect(4);

    let record = { type: 'planet', attributes: { name: 'Pluto', classification: 'ice' } };

    fetchStub
      .withArgs('/planets')
      .returns(jsonapiResponse(201, {
        data: { type: 'planets', id: '12345', attributes: { name: 'Pluto', classification: 'ice' } }
      }));

    return store.update(addRecord(record))
      .then(() => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'POST', 'fetch called with expected method');

        assert.equal(store.cache.get(['planet', record.id, 'attributes', 'name']), 'Pluto', 'record matches');

        verifyLocalStorageContainsRecord(backup, record);
      });
  });

  test('#update - addRecord - error', function(assert) {
    assert.expect(5);

    let record = { type: 'planet', attributes: { name: 'Pluto' } };
    let errors = {
      errors: [
        {
          status: 422,
          source: {
            pointer: 'data/attributes/name'
          },
          title: 'Invalid Attribute',
          detail: 'Pluto isn\'t really a planet!'
        }
      ]
    };

    fetchStub
      .withArgs('/planets')
      .returns(jsonapiResponse(422, errors));

    return store.update(addRecord(record))
      .catch(error => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'POST', 'fetch called with expected method');
        assert.equal(error.response.status, 422, 'error status matches');
        assert.deepEqual(error.data, errors, 'error data matches');

        verifyLocalStorageDoesNotContainRecord(backup, record);
      });
  });

  test('#update - replaceRecord', function(assert) {
    assert.expect(4);

    const pluto = { type: 'planet', id: 'pluto', attributes: { name: 'Pluto', classification: 'superior' } };
    const pluto2 = { type: 'planet', id: 'pluto', keys: { remoteId: 'pluto2' }, attributes: { name: 'Pluto2', classification: 'gas giant' } };

    store.cache.patch(
      addRecord(pluto)
    );

    fetchStub
      .withArgs('/planets/pluto')
      .returns(jsonapiResponse(200));

    return store.update(replaceRecord(pluto2))
      .then(() => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');

        assert.equal(store.cache.get(['planet', 'pluto', 'attributes', 'name']), 'Pluto2', 'record matches');

        verifyLocalStorageContainsRecord(backup, pluto2);
      });
  });

  test('#update - removeRecord', function(assert) {
    assert.expect(4);

    const pluto = { type: 'planet', id: 'pluto' };

    fetchStub
      .withArgs('/planets/pluto')
      .returns(jsonapiResponse(200));

    store.cache.patch(addRecord(pluto));

    return store.update(removeRecord(pluto))
      .then(() => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'DELETE', 'fetch called with expected method');

        assert.notOk(store.cache.has(['planet', 'pluto']), 'cache updated');

        verifyLocalStorageDoesNotContainRecord(backup, pluto);
      });
  });

  test('#update - addToHasMany', function(assert) {
    assert.expect(3);

    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };

    store.cache.patch([
      addRecord(jupiter),
      addRecord(io)
    ]);

    fetchStub
      .withArgs('/planets/jupiter/relationships/moons')
      .returns(jsonapiResponse(201));

    return store.update(addToHasMany(jupiter, 'moons', io))
      .then(() => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'POST', 'fetch called with expected method');

        const cacheJupiter = store.cache.get(['planet', 'jupiter']);
        assert.deepEqual(cacheJupiter.relationships.moons.data, { 'moon:io': true }, 'cache updated');
      });
  });

  test('#update - removeFromHasMany', function(assert) {
    assert.expect(3);

    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };

    store.cache.patch([
      addRecord(jupiter),
      addRecord(io),
      addToHasMany(jupiter, 'moons', io)
    ]);

    fetchStub
      .withArgs('/planets/jupiter/relationships/moons')
      .returns(jsonapiResponse(200));

    return store.update(removeFromHasMany(jupiter, 'moons', io))
      .then(() => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'DELETE', 'fetch called with expected method');

        const cacheJupiter = store.cache.get(['planet', 'jupiter']);
        assert.deepEqual(cacheJupiter.relationships.moons.data, {}, 'cache updated');
      });
  });

  test('#update - replaceHasOne', function(assert) {
    assert.expect(4);

    const earth = { type: 'planet', id: 'earth' };
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };

    store.cache.patch([
      addRecord(earth),
      addRecord(jupiter),
      addRecord(io),
      replaceHasOne(io, 'planet', jupiter)
    ]);

    fetchStub
      .withArgs('/moons/io')
      .returns(jsonapiResponse(200));

    return store.update(replaceHasOne(io, 'planet', earth))
      .then(() => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');
        assert.deepEqual(
          JSON.parse(fetchStub.getCall(0).args[1].body),
          { data: { id: 'io', type: 'moons', relationships: { planet: { data: { type: 'planets', id: 'earth' } } } } },
          'fetch called with expected data');

        const cacheIo = store.cache.get(['moon', 'io']);
        assert.deepEqual(cacheIo.relationships.planet.data, 'planet:earth', 'updated cache');
      });
  });

  test('#update - replaceHasMany', function(assert) {
    assert.expect(4);

    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const europa = { type: 'moon', id: 'europa' };

    store.cache.patch([
      addRecord(jupiter),
      addRecord(io),
      addRecord(europa)
    ]);

    fetchStub
      .withArgs('/planets/jupiter')
      .returns(jsonapiResponse(200));

    return store.update(replaceHasMany(jupiter, 'moons', [io, europa]))
      .then(() => {
        const cacheJupiter = store.cache.get(['planet', 'jupiter']);
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, 'PATCH', 'fetch called with expected method');
        assert.deepEqual(
          JSON.parse(fetchStub.getCall(0).args[1].body),
          { data: { id: 'jupiter', type: 'planets', relationships: { moons: { data: [{ type: 'moons', id: 'io' }, { type: 'moons', id: 'europa' }] } } } },
          'fetch called with expected data');

        assert.deepEqual(cacheJupiter.relationships.moons.data, { 'moon:io': true, 'moon:europa': true });
      });
  });

  QUnit.skip('replaceKey', function(assert) {
    return store.replaceKey({ type: 'planet', id: 'pluto' }, 'remoteId', 'abc1234')
      .then(() => {
        const record = store.cache.get(['planet', 'pluto']);
        assert.equal(record.remoteId, 'abc1234', 'key updated on record');
      });
  });

  test('find records of a particular type', function(assert) {
    assert.expect(3);

    const data = [
      { type: 'planets', attributes: { name: 'Jupiter', classification: 'gas giant' } }
    ];

    fetchStub
      .withArgs('/planets')
      .returns(jsonapiResponse(200, { data }));

    return store.query(qb.records('planet'))
      .then(planets => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');

        assert.deepEqual(Object.keys(planets).map(k => planets[k].attributes.name), ['Jupiter']);
      });
  });

  test('find an individual record', function(assert) {
    assert.expect(5);

    const data = { type: 'planets', id: '12345', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    fetchStub
      .withArgs('/planets/12345')
      .returns(jsonapiResponse(200, { data }));

    return store
      .query(qb.record({ type: 'planet', id: '12345' }))
      .then(record => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');

        assert.equal(record.type, 'planet');
        assert.equal(record.id, '12345');
        assert.equal(record.attributes.name, 'Jupiter');
      });
  });

  test('find records of a particular type using a filter', function(assert) {
    assert.expect(3);

    const data = [
      { type: 'planets', id: '12345', attributes: { name: 'Jupiter', classification: 'gas giant' } }
    ];

    fetchStub
      .withArgs(`/planets?${encodeURIComponent('filter[name]')}=Jupiter`)
      .returns(jsonapiResponse(200, { data }));

    return store
      .query(qb.records('planet')
               .filterAttributes({ name: 'Jupiter' }))
      .then(planets => {
        assert.equal(fetchStub.callCount, 1, 'fetch called once');
        assert.equal(fetchStub.getCall(0).args[1].method, undefined, 'fetch called with no method (equivalent to GET)');

        assert.deepEqual(Object.keys(planets).map(k => planets[k].attributes.name), ['Jupiter']);
      });
  });
});
