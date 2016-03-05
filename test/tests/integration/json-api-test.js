import { planetsSchema as schema } from 'tests/test-helper';
import Store from 'orbit-common/store';
import JsonApiSource from 'orbit-common/jsonapi-source';
import TransformQueue from 'orbit/transform-queue';


module('Integration - JSONAPI', function(hooks) {
  let store;
  let jsonApiSource;
  let queue;

  hooks.beforeEach(function() {
    jsonApiSource = new JsonApiSource({ schema: schema });
    store = new Store({ schema: schema });
    queue = new TransformQueue();

    store.on('transform', t => queue.add(t));
    queue.on('transform', t => jsonApiSource.transform(t).catch(e => store.deny(t, e)));
    jsonApiSource.on('transform', t => store.confirm(t));
  });

  test('add record', function(assert) {
    const done = assert.async();

    store.addRecord({ type: 'planet', attributes: { name: 'Pluto' } })
      .then(pluto => {
        assert.equal(pluto.name, 'Pluto', 'Attribute stored with record');
      })
      .finally(done);
  });
});
