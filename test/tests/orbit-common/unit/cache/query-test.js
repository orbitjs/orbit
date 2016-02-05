import Orbit from 'orbit/main';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import { equalOps, op } from 'tests/test-helper';
import { Promise, on } from 'rsvp';
import {
  queryExpression as oqe
} from 'orbit/query/expression';
import {
  addRecordOperation
} from 'orbit-common/lib/operations';
import Transform from 'orbit/transform';
import {
  RecordNotFoundException
} from 'orbit-common/lib/exceptions';

var schema,
    cache;

module('OC - Cache - query', {
  setup: function() {
    Orbit.Promise = Promise;
    schema = new Schema({
      models: {
        planet: {
          relationships: {
            moons: { type: 'hasMany', model: 'moon' }
          }
        },
        moon: {
          relationships: {
            planet: { type: 'hasOne', model: 'planet' }
          }
        }
      }
    });
  },

  teardown: function() {
    schema = null;
  }
});

test('can `get`', function(assert) {
  cache = new Cache(schema);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  cache.reset({ planet: { jupiter } });

  assert.deepEqual(
    cache.query(oqe('get', 'planet/jupiter')),
    jupiter
  );
});

test('can perform a simple matching filter', function(assert) {
  cache = new Cache(schema);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
  let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
  let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

  cache.reset({ planet: { jupiter, earth, venus, mercury } });

  assert.deepEqual(
    cache.query(
      oqe('filter',
          'planet',
          oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'))
    ),
    {
      jupiter
    }
  );
});

test('can perform a complex conditional `and` filter', function(assert) {
  cache = new Cache(schema);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
  let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
  let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

  cache.reset({ planet: { jupiter, earth, venus, mercury } });

  assert.deepEqual(
    cache.query(
      oqe('filter',
          'planet',
          oqe('and',
            oqe('equal', oqe('get', 'attributes/classification'), 'terrestrial'),
            oqe('equal', oqe('get', 'attributes/atmosphere'), true)
          ))
    ),
    {
      earth,
      venus
    }
  );
});

test('can perform a complex conditional `or` filter', function(assert) {
  cache = new Cache(schema);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
  let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
  let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

  cache.reset({ planet: { jupiter, earth, venus, mercury } });

  assert.deepEqual(
    cache.query(
      oqe('filter',
          'planet',
          oqe('or',
              oqe('equal', oqe('get', 'attributes/classification'), 'gas giant'),
              oqe('equal', oqe('get', 'attributes/atmosphere'), true)
         ))
    ),
    {
      jupiter,
      earth,
      venus
    }
  );
});

test('relatedRecords', function(assert) {
  cache = new Cache(schema);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  const callisto = {
    id: 'callisto', type: 'moon',
    attributes: { name: 'Callisto' },
    relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({ planet: { jupiter }, moon: { callisto } });

  assert.deepEqual(
    cache.query(oqe('relatedRecords', 'planet', 'jupiter', 'moons')),
    {
      callisto
    }
  );
});

test('relatedRecord', function(assert) {
  cache = new Cache(schema);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  const callisto = {
    id: 'callisto', type: 'moon',
    attributes: { name: 'Callisto' },
    relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({ planet: { jupiter }, moon: { callisto } });

  assert.deepEqual(
    cache.query(oqe('relatedRecord', 'moon', 'callisto', 'planet')),
    {
      jupiter
    }
  );
});

test('record', function(assert) {
  cache = new Cache(schema);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  cache.reset({ planet: { jupiter } });

  assert.deepEqual(
    cache.query(oqe('record', 'planet', 'jupiter')),
    jupiter
  );
});

test('record - finds record', function(assert) {
  cache = new Cache(schema);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  cache.reset({ planet: { jupiter } });

  assert.deepEqual(
    cache.query(oqe('record', 'planet', 'jupiter')),
    jupiter
  );
});

test('record - throws RecordNotFoundException if record doesn\'t exist', function(assert) {
  cache = new Cache(schema);

  assert.throws(
    () => cache.query(oqe('record', 'planet', 'jupiter')),
    new RecordNotFoundException('Record not found planet:jupiter')
  );
});

