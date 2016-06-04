import 'tests/test-helper';
import { queryExpression as oqe } from 'orbit/query/expression';
import qb from 'orbit-common/query/builder';

module('OC - QueryBuilder', function() {
  test('record', function(assert) {
    assert.deepEqual(
      qb.record({ type: 'planet', id: '123' }).toQueryExpression(),

      oqe('record', { type: 'planet', id: '123' })
    );
  });

  test('record', function(assert) {
    assert.deepEqual(
      qb.record({ type: 'planet', id: '123' }).toQueryExpression(),

      oqe('record', { type: 'planet', id: '123' })
    );
  });

  test('recordsOfType', function(assert) {
    assert.deepEqual(
      qb.recordsOfType('planet').toQueryExpression(),

      oqe('recordsOfType', 'planet')
    );
  });

  test('recordsOfType/filter/equal/get', function(assert) {
    assert.deepEqual(
      qb.recordsOfType('planet')
        .filter(record => record.attribute('name').equal('Pluto'))
        .toQueryExpression(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
        oqe('equal', oqe('attribute', 'name'), 'Pluto'))
    );
  });

  test('recordsOfType/filter/equal/get/or', function(assert) {
    assert.deepEqual(
      qb.recordsOfType('planet')
        .filter(record =>
          qb.or(
            record.attribute('name').equal('Jupiter'),
            record.attribute('name').equal('Pluto')
          )
        )
        .toQueryExpression(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('or',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'name'), 'Pluto')))
    );
  });

  test('recordsOfType/filter/equal/get/and', function(assert) {
    assert.deepEqual(
      qb.recordsOfType('planet')
        .filter(record =>
          qb.and(
            record.attribute('name').equal('Jupiter'),
            record.attribute('name').equal('Pluto')
          )
        )
        .toQueryExpression(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'name'), 'Pluto')))
    );
  });

  test('recordsOfType/filter/equal/attribute/and', function(assert) {
    assert.deepEqual(
      qb.recordsOfType('planet')
        .filter(record =>
          qb.and(
            record.attribute('name').equal('Jupiter'),
            record.attribute('name').equal('Pluto')
          )
        )
        .toQueryExpression(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'name'), 'Pluto')))
    );
  });

  test('recordsOfType/filterAttributes', function(assert) {
    assert.deepEqual(
      qb.recordsOfType('planet')
        .filterAttributes({ 'name': 'Jupiter', 'age': '23000000' })
        .toQueryExpression(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'age'), '23000000')))
    );
  });
});
