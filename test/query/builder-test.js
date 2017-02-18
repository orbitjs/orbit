import { queryExpression as oqe } from '../../src/query-expression';
import qb from '../../src/query/builder';
import '../test-helper';

const { module, test } = QUnit;

module('QueryBuilder', function() {
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

  test('records', function(assert) {
    assert.deepEqual(
      qb.records('planet').toQueryExpression(),

      oqe('records', 'planet')
    );
  });

  test('records/filter/equal/get', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .filter(record => record.attribute('name').equal('Pluto'))
        .toQueryExpression(),

      oqe('filter',
        oqe('records', 'planet'),
        oqe('equal', oqe('attribute', 'name'), 'Pluto'))
    );
  });

  test('records/filter/equal/get/or', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .filter(record =>
          qb.or(
            record.attribute('name').equal('Jupiter'),
            record.attribute('name').equal('Pluto')
          )
        )
        .toQueryExpression(),

      oqe('filter',
        oqe('records', 'planet'),
          oqe('or',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'name'), 'Pluto')))
    );
  });

  test('records/filter/equal/get/and', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .filter(record =>
          qb.and(
            record.attribute('name').equal('Jupiter'),
            record.attribute('name').equal('Pluto')
          )
        )
        .toQueryExpression(),

      oqe('filter',
        oqe('records', 'planet'),
          oqe('and',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'name'), 'Pluto')))
    );
  });

  test('records/filter/equal/attribute/and', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .filter(record =>
          qb.and(
            record.attribute('name').equal('Jupiter'),
            record.attribute('name').equal('Pluto')
          )
        )
        .toQueryExpression(),

      oqe('filter',
        oqe('records', 'planet'),
          oqe('and',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'name'), 'Pluto')))
    );
  });

  test('records/filterAttributes', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .filterAttributes({ 'name': 'Jupiter', 'age': '23000000' })
        .toQueryExpression(),

      oqe('filter',
        oqe('records', 'planet'),
          oqe('and',
            oqe('equal', oqe('attribute', 'name'), 'Jupiter'),
            oqe('equal', oqe('attribute', 'age'), '23000000')))
    );
  });

  test('records/sort (one field, compact)', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .sort('name')
        .toQueryExpression(),

      oqe('sort',
        oqe('records', 'planet'),
        [{ field: oqe('attribute', 'name'), order: 'ascending' }])
    );
  });

  test('records/sort (one field descending, compact)', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .sort('-name')
        .toQueryExpression(),

      oqe('sort',
        oqe('records', 'planet'),
        [{ field: oqe('attribute', 'name'), order: 'descending' }])
    );
  });

  test('records/sort (multiple fields, compact)', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .sort('name', 'age')
        .toQueryExpression(),

      oqe('sort',
        oqe('records', 'planet'),
        [
          { field: oqe('attribute', 'name'), order: 'ascending' },
          { field: oqe('attribute', 'age'), order: 'ascending' }
        ])
    );
  });

  test('records/sort (one field, default order)', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .sort({ attribute: 'name' })
        .toQueryExpression(),

      oqe('sort',
        oqe('records', 'planet'),
        [{ field: oqe('attribute', 'name'), order: 'ascending' }])
    );
  });

  test('records/sort (one field, ascending order)', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .sort({ attribute: 'name', order: 'ascending' })
        .toQueryExpression(),

      oqe('sort',
        oqe('records', 'planet'),
        [{ field: oqe('attribute', 'name'), order: 'ascending' }])
    );
  });

  test('records/sort (one field, descending order)', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .sort({ attribute: 'name', order: 'descending' })
        .toQueryExpression(),

      oqe('sort',
        oqe('records', 'planet'),
        [{ field: oqe('attribute', 'name'), order: 'descending' }])
    );
  });

  test('records/sort (multiple fields)', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .sort(
          { attribute: 'name', order: 'ascending' },
          { attribute: 'age', order: 'ascending' }
        )
        .toQueryExpression(),

      oqe('sort',
        oqe('records', 'planet'),
        [
          { field: oqe('attribute', 'name'), order: 'ascending' },
          { field: oqe('attribute', 'age'), order: 'ascending' }
        ])
    );
  });

  test('records/sort (unsupported sort field type)', function(assert) {
    assert.throws(
      () => {
        qb.records('planet')
          .sort({});
      },
      new Error('Unsupported sort field type.')
    );
  });

  test('records/sort (invalid sort order)', function(assert) {
    assert.throws(
      () => {
        qb.records('planet')
          .sort({ attribute: 'name', order: 'invalid' });
      },
      new Error('Invalid sort order.')
    );
  });

  test('records/sort (invalid sort expression)', function(assert) {
    assert.throws(
      () => {
        qb.records('planet')
          .sort(null);
      },
      new Error('Sort expression must be either an object or a string.')
    );
  });

  test('records/page', function(assert) {
    assert.deepEqual(
      qb.records('planet')
        .page({ offset: 1, limit: 10})
        .toQueryExpression(),

      oqe('page',
        oqe('records', 'planet'),
        { offset: 1, limit: 10 })
    );
  });
});
