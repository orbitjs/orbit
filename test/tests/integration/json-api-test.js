import { planetsSchema as schema } from 'tests/test-helper';
import Store from 'orbit-common/store';
import JsonApiSource from 'orbit-common/jsonapi-source';
import TransformQueue from 'orbit/transform-queue';

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
    queue.on('transform', t => jsonApiSource.transform(t).catch(e => store.deny(t, e)));
    jsonApiSource.on('transform', t => store.confirm(t));
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
});
