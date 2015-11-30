import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import Source from 'orbit-common/source';
import { all, Promise } from 'rsvp';
import { RecordNotFoundException, LinkNotFoundException } from 'orbit-common/lib/exceptions';
import { spread } from 'orbit/lib/functions';
import { uuid } from 'orbit/lib/uuid';
import { toIdentifier } from 'orbit-common/lib/identifiers';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import 'tests/test-helper';
import {
  queryExpression as oqe
} from 'orbit-common/oql/expressions';

///////////////////////////////////////////////////////////////////////////////

module('OC - MemorySource', function(hooks) {
  let schema, source;

  hooks.beforeEach(function() {
    Orbit.Promise = Promise;

    schema = new Schema({
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

    source = new MemorySource({ schema: schema });
  });

  hooks.afterEach(function() {
    schema = null;
    source = null;
    Orbit.Promise = null;
  });

  test('it exists', function(assert) {
    assert.ok(source);
  });

  test('its prototype chain is correct', function(assert) {
    assert.ok(source instanceof Source, 'instanceof Source');
  });

  test('internal cache\'s options can be specified with `cacheOptions`', function() {
    var source = new MemorySource({ schema: schema, cacheOptions: { processors: [CacheIntegrityProcessor, SchemaConsistencyProcessor] } });
    ok(source.cache, 'cache exists');
    equal(source.cache._processors.length, 2, 'cache has 2 processors');
  });

  test('#transform - transforms the source\'s cache', function(assert) {
    const done = assert.async();
    expect(3);

    let jupiter = {
      id: '1',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    let op = {
      op: 'add',
      path: 'planet/1',
      value: jupiter
    };

    assert.equal(source.cache.length('planet'), 0, 'cache should start empty');

    source.transform(op)
      .then(function(result) {
        assert.equal(source.cache.length('planet'), 1, 'cache should contain one planet');
        assert.deepEqual(source.cache.get('planet/1'), jupiter, 'planet should be jupiter');
        done();
      });
  });

  test('#query - queries the source\'s cache', function(assert) {
    const done = assert.async();
    expect(2);

    let jupiter = {
      id: '1',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    source.cache.reset({
      planet: {
        '1': jupiter
      }
    });

    assert.equal(source.cache.length('planet'), 1, 'cache should contain one planet');

    source.query({ oql: oqe('get', 'planet/1') })
      .then(function(foundPlanet) {
        strictEqual(foundPlanet, jupiter, 'found planet matches original');
        done();
      });
  });
});
