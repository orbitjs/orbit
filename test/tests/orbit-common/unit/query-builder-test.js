import 'tests/test-helper';

import { queryExpression as oqe } from 'orbit-common/oql/expressions';

import QueryBuilder from 'orbit-common/query-builder';

function assertEqualQuery(actual, expected) {
  function jsonify(query) {
    return JSON.parse(JSON.stringify(query));
  }

  deepEqual(actual.toString(), expected.toString());
}

module('OC - QueryBuilder', function(hooks) {
  let qb;

  hooks.beforeEach(function() {
    qb = new QueryBuilder();
  });

  test('recordsOfType', function(assert) {
    assertEqualQuery(
      qb.recordsOfType('planet').build(),

      oqe('recordsOfType', 'planet')
    );
  });

  test('recordsOfType/filter/equal/get', function(assert) {
    assertEqualQuery(
      qb
        .recordsOfType('planet')
        .filter(record => record.get('attributes/name').equal('Pluto'))
        .build(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
        oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );
  });

  test('recordsOfType/filter/equal/get/or', function(assert) {
    assertEqualQuery(
      qb
        .recordsOfType('planet')
        .filter(record =>
          qb.or(
            record.get('attributes/name').equal('Jupiter'),
            record.get('attributes/name').equal('Pluto')
          )
        )
        .build(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('or',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/name'), 'Pluto')))
    );
  });

  test('recordsOfType/filter/equal/get/and', function(assert) {
    assertEqualQuery(
      qb
        .recordsOfType('planet')
        .filter(record =>
          qb.and(
            record.get('attributes/name').equal('Jupiter'),
            record.get('attributes/name').equal('Pluto')
          )
        )
        .build(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/name'), 'Pluto')))
    );
  });

  test('recordsOfType/filter/equal/attribute/and', function(assert) {
    assertEqualQuery(
      qb
        .recordsOfType('planet')
        .filter(record =>
          qb.and(
            record.attribute('name').equal('Jupiter'),
            record.attribute('name').equal('Pluto')
          )
        )
        .build(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/name'), 'Pluto')))
    );
  });

  test('recordsOfType/filterAttributes', function(assert) {
    assertEqualQuery(
      qb
        .recordsOfType('planet')
        .filterAttributes({ 'name': 'Jupiter', 'age': '23000000' })
        .build(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
          oqe('and',
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'),
            oqe('equal', oqe('get', 'attributes/age'), '23000000')))
    );
  });

  test('recordsOfType with scopes', function(assert) {
    const planetScopes = {
      namedPluto() {
        return this.filterAttributes({ name: 'Pluto' });
      }
    };

    const qb = new QueryBuilder({
      terms: {
        recordsOfType: { planet: planetScopes }
      }
    });

    assertEqualQuery(
      qb
        .recordsOfType('planet')
        .namedPluto()
        .build(),

      oqe('filter',
        oqe('recordsOfType', 'planet'),
        oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );
  });
});
