import { planetsSchema } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import Store from 'orbit-common/store';
import BlockingCoordinator from 'orbit-common/blocking-coordinator';
import { Promise, all } from 'rsvp';
import { queryExpression as oqe } from 'orbit/query/expression';

const { skip } = QUnit;

let schema = planetsSchema;
let source;
let coordinator;
let store;

module('Integration - Blocking Coordinator', function(hooks) {
  hooks.beforeEach(function() {
    // Create sources
    source = new MemorySource({ schema: schema });
    coordinator = new BlockingCoordinator({ schema, source });

    coordinator.id = 'coordinator';
    source.id = 'source';

    // Create Store
    store = new Store({ schema, coordinator });
  });

  hooks.afterEach(function() {
    store = null;
    source = null;
  });

  test('addRecord', function(assert) {
    expect(2);
    const done = assert.async();

    store
      .addRecord({ id: '123', type: 'planet', attributes: { name: 'Jupiter' } })
      .then(() => store.query(oqe('record', 'planet', '123')))
      .then(storePlanet => assert.ok(storePlanet, 'record is added to Store'))
      .then(() => source.query(oqe('record', 'planet', '123')))
      .then(sourcePlanet => assert.ok(sourcePlanet, 'record is added to Source'))
      .finally(done);
  });
});

