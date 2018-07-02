import QueryBuilder from '../src/query-builder';
import './test-helper';

const { module, test } = QUnit;

module('QueryBuilder', function(hooks) {
  let oqb;

  hooks.beforeEach(function() {
    oqb = new QueryBuilder();
  });

  test('findRecord', function(assert) {
    assert.deepEqual(
      oqb.findRecord({ type: 'planet', id: '123' }).toQueryExpression(),
      {
        op: 'findRecord',
        record: {
          type: 'planet',
          id: '123'
        }
      }
    );
  });

  test('findRecords', function(assert) {
    assert.deepEqual(
      oqb.findRecords('planet').toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet'
      }
    );
  });

  test('findRecords + attribute filter', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .filter({ attribute: 'name', value: 'Pluto' })
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        filter: [
          {
            op: 'equal',
            kind: 'attribute',
            attribute: 'name',
            value: 'Pluto'
          }
        ]
      }
    );
  });

  test('findRecords + attribute filters', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .filter({ attribute: 'atmosphere', value: true },
                { attribute: 'classification', value: 'terrestrial' })
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        filter: [
          {
            op: 'equal',
            kind: 'attribute',
            attribute: 'atmosphere',
            value: true
          },
          {
            op: 'equal',
            kind: 'attribute',
            attribute: 'classification',
            value: 'terrestrial'
          }
        ]
      }
    );
  });

  test('findRecords + hasOne filter', function (assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .filter({ relation: 'star', record: { id: '1', type: 'star' } })
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        filter: [
          {
            op: 'equal',
            kind: 'relatedRecord',
            relation: 'star',
            record: { id: '1', type: 'star' }
          }
        ]
      }
    );
  });

  test('findRecords + hasMany filter', function (assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .filter({
          relation: 'moons',
          records: [{ id: '1', type: 'moon' }, { id: '2', type: 'moon' }],
          op: 'equal'
        })
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        filter: [
          {
            op: 'equal',
            kind: 'relatedRecords',
            relation: 'moons',
            records: [{ id: '1', type: 'moon' }, { id: '2', type: 'moon' }]
          }
        ]
      }
    );
  });

  test('findRecords + sort (one field, compact)', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .sort('name')
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          }
        ]
      }
    );
  });

  test('findRecords + sort (one field descending, compact)', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .sort('-name')
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'descending'
          }
        ]
      }
    );
  });

  test('findRecords + sort (multiple fields, compact)', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .sort('name', 'age')
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          },
          {
            kind: 'attribute',
            attribute: 'age',
            order: 'ascending'
          }
        ]
      }
    );
  });

  test('findRecords + sort (one field, verbose)', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .sort({ attribute: 'name' })
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          }
        ]
      }
    );
  });

  test('findRecords + sort (one field, specified order, verbose)', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .sort({ attribute: 'name', order: 'ascending' })
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          }
        ]
      }
    );
  });

  test('findRecords + sort (one field, specified order, verbose)', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .sort({ attribute: 'name', order: 'ascending' },
              { attribute: 'age', order: 'descending' })
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          },
          {
            kind: 'attribute',
            attribute: 'age',
            order: 'descending'
          }
        ]
      }
    );
  });

  test('findRecords + sort (invalid sort expression)', function(assert) {
    assert.throws(
      () => {
        oqb
          .findRecords('planet')
          .sort(null);
      },
      new Error('Sort expression must be either an object or a string.')
    );
  });

  test('findRecords + page', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .page({ offset: 1, limit: 10})
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        page: { offset: 1, limit: 10 }
      }
    );
  });

  test('findRecords + filter + sort + page', function(assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .filter({ attribute: 'name', value: 'Jupiter' },
                { attribute: 'age', value: 23000000})
        .page({ offset: 1, limit: 10})
        .sort('-name')
        .toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        filter: [
          {
            op: 'equal',
            kind: 'attribute',
            attribute: 'name',
            value: 'Jupiter'
          },
          {
            op: 'equal',
            kind: 'attribute',
            attribute: 'age',
            value: 23000000
          }
        ],
        page: { offset: 1, limit: 10 },
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'descending'
          }
        ]
      }
    );
  });
});
