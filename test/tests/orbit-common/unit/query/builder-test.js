import 'tests/test-helper';
import { queryExpression as oqe } from 'orbit/query/expression';
import QueryBuilder from 'orbit-common/query/builder';
import { Records } from 'orbit-common/query/terms';

module('OC - QueryBuilder', function(hooks) {
  let qb;

  hooks.beforeEach(function() {
    qb = new QueryBuilder();
  });

  test('recordsOfType', function(assert) {
    assert.deepEqual(
      qb.build(q => q.recordsOfType('planet')).expression,

      oqe('recordsOfType', 'planet')
    );
  });

  test('recordsOfType/filter/equal/get', function(assert) {
    assert.deepEqual(
      qb.build(q => {
        return q.recordsOfType('planet')
                .filter(record => record.get('attributes/name').equal('Pluto'));
      }).expression,

      oqe('filter',
        oqe('recordsOfType', 'planet'),
        oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );
  });

  test('recordsOfType/filter/equal/get/or', function(assert) {
    assert.deepEqual(
      qb.build(q => q.recordsOfType('planet')
                     .filter(record =>
                       q.or(
                         record.get('attributes/name').equal('Jupiter'),
                         record.get('attributes/name').equal('Pluto')
                       )
                     )
      ).expression,

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('or',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/name'), 'Pluto')))
    );
  });

  test('recordsOfType/filter/equal/get/and', function(assert) {
    assert.deepEqual(
      qb.build(q => q.recordsOfType('planet')
                     .filter(record =>
                       q.and(
                         record.get('attributes/name').equal('Jupiter'),
                         record.get('attributes/name').equal('Pluto')
                       )
                     )
      ).expression,

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/name'), 'Pluto')))
    );
  });

  test('recordsOfType/filter/equal/attribute/and', function(assert) {
    assert.deepEqual(
      qb.build(q => q.recordsOfType('planet')
                     .filter(record =>
                       q.and(
                         record.attribute('name').equal('Jupiter'),
                         record.attribute('name').equal('Pluto')
                       )
                     )
      ).expression,

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/name'), 'Pluto')))
    );
  });

  test('recordsOfType/filterAttributes', function(assert) {
    assert.deepEqual(
      qb.build(q => q.recordsOfType('planet')
                     .filterAttributes({ 'name': 'Jupiter', 'age': '23000000' })
      ).expression,

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/age'), '23000000')))
    );
  });

  test('recordsOfType with scopes', function(assert) {
    class PlanetRecords extends Records {
      namedPluto() {
        return this.filterAttributes({ name: 'Pluto' });
      }
    }

    const qb = new QueryBuilder({
      terms: { PlanetRecords }
    });

    assert.deepEqual(
      qb.build(q => q.recordsOfType('planet')
                     .namedPluto()
      ).expression,

      oqe('filter',
        oqe('recordsOfType', 'planet'),
        oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );
  });
});
