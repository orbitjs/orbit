import QueryBuilder from '../src/query-builder';
import './test-helper';
import { FindRecord, FindRecords } from '../src/query-expression';

const { module, test } = QUnit;

module('QueryBuilder', function(hooks) {
  let oqb: QueryBuilder;

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
      } as FindRecord
    );
  });

  test('findRecords by type', function(assert) {
    assert.deepEqual(
      oqb.findRecords('planet').toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet'
      } as FindRecords
    );
  });

  test('findRecords by identities', function(assert) {
    assert.deepEqual(
      oqb.findRecords([{ type: 'planet', id: 'earth' }, { type: 'planet', id: 'mars' }]).toQueryExpression(),
      {
        op: 'findRecords',
        records: [{ type: 'planet', id: 'earth' }, { type: 'planet', id: 'mars' }]
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
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
      } as FindRecords
    );
  });

  test('findRecords + sort (invalid sort expression)', function(assert) {
    assert.throws(
      () => {
        oqb
          .findRecords('planet')
          .sort(null);
      },
      new Error('Unrecognized sort param.')
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
        page: {
          kind: 'offsetLimit',
          offset: 1,
          limit: 10
        }
      } as FindRecords
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
        page: {
          kind: 'offsetLimit',
          offset: 1,
          limit: 10
        },
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'descending'
          }
        ]
      } as FindRecords
    );
  });
});
