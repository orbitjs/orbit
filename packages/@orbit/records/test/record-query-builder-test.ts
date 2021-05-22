import { RecordQueryBuilder } from '../src/record-query-builder';
import {
  FindRecord,
  FindRecords,
  FindRelatedRecords,
  FindRelatedRecord
} from '../src/record-query-expression';

const { module, test } = QUnit;

module('RecordQueryBuilder', function (hooks) {
  let oqb: RecordQueryBuilder;

  hooks.beforeEach(function () {
    oqb = new RecordQueryBuilder();
  });

  test('findRecord', function (assert) {
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

  test('findRecord + options', function (assert) {
    assert.deepEqual(
      oqb
        .findRecord({ type: 'planet', id: '123' })
        .options({ url: '/test' })
        .toQueryExpression(),
      {
        op: 'findRecord',
        options: {
          url: '/test'
        },
        record: {
          type: 'planet',
          id: '123'
        }
      } as FindRecord
    );
  });

  test('findRecord + merged options', function (assert) {
    assert.deepEqual(
      oqb
        .findRecord({ type: 'planet', id: '123' })
        .options({ source: { remote: { url: '/test' } } })
        .options({ source: { remote: { reload: true } } })
        .toQueryExpression(),
      {
        op: 'findRecord',
        options: {
          source: {
            remote: {
              url: '/test',
              reload: true
            }
          }
        },
        record: {
          type: 'planet',
          id: '123'
        }
      } as FindRecord
    );
  });

  test('findRecords by type', function (assert) {
    assert.deepEqual(oqb.findRecords('planet').toQueryExpression(), {
      op: 'findRecords',
      type: 'planet'
    } as FindRecords);
  });

  test('findRecords by identities', function (assert) {
    assert.deepEqual(
      oqb
        .findRecords([
          { type: 'planet', id: 'earth' },
          { type: 'planet', id: 'mars' }
        ])
        .toQueryExpression(),
      {
        op: 'findRecords',
        records: [
          { type: 'planet', id: 'earth' },
          { type: 'planet', id: 'mars' }
        ]
      } as FindRecords
    );
  });

  test('findRecords + options', function (assert) {
    assert.deepEqual(
      oqb.findRecords('planet').options({ url: '/test' }).toQueryExpression(),
      {
        op: 'findRecords',
        type: 'planet',
        options: { url: '/test' }
      } as FindRecords
    );
  });

  test('findRecords + attribute filter', function (assert) {
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

  test('findRecords + attribute filters', function (assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .filter(
          { attribute: 'atmosphere', value: true },
          { attribute: 'classification', value: 'terrestrial' }
        )
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

  test('findRecords + filter (invalid filter expression)', function (assert) {
    assert.throws(() => {
      oqb
        .findRecords('planet')
        // testing a common mistake for a new Orbiteer not using TypeScript
        .filter({ name: 'Pluto' } as any)
        .toQueryExpression();
    }, new Error('Unrecognized `filter` param encountered while building query expression'));
  });

  test('findRecords + attribute filter', function (assert) {
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
          records: [
            { id: '1', type: 'moon' },
            { id: '2', type: 'moon' }
          ],
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
            records: [
              { id: '1', type: 'moon' },
              { id: '2', type: 'moon' }
            ]
          }
        ]
      } as FindRecords
    );
  });

  test('findRecords + sort (one field, compact)', function (assert) {
    assert.deepEqual(
      oqb.findRecords('planet').sort('name').toQueryExpression(),
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

  test('findRecords + sort (one field descending, compact)', function (assert) {
    assert.deepEqual(
      oqb.findRecords('planet').sort('-name').toQueryExpression(),
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

  test('findRecords + sort (multiple fields, compact)', function (assert) {
    assert.deepEqual(
      oqb.findRecords('planet').sort('name', 'age').toQueryExpression(),
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

  test('findRecords + sort (one field, verbose)', function (assert) {
    assert.deepEqual(
      oqb.findRecords('planet').sort({ attribute: 'name' }).toQueryExpression(),
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

  test('findRecords + sort (one field, specified order, verbose)', function (assert) {
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

  test('findRecords + sort (one field, specified order, verbose)', function (assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .sort(
          { attribute: 'name', order: 'ascending' },
          { attribute: 'age', order: 'descending' }
        )
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

  test('findRecords + sort (invalid sort expression)', function (assert) {
    assert.throws(() => {
      oqb.findRecords('planet').sort(null as any);
    }, new Error('Unrecognized `sort` param encountered while building query expression'));
  });

  test('findRecords + page', function (assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .page({ offset: 1, limit: 10 })
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

  test('findRecords + filter + sort + page', function (assert) {
    assert.deepEqual(
      oqb
        .findRecords('planet')
        .filter(
          { attribute: 'name', value: 'Jupiter' },
          { attribute: 'age', value: 23000000 }
        )
        .page({ offset: 1, limit: 10 })
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

  test('findRelatedRecord', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecord({ type: 'moon', id: '123' }, 'planet')
        .toQueryExpression(),
      {
        op: 'findRelatedRecord',
        record: {
          id: '123',
          type: 'moon'
        },
        relationship: 'planet'
      } as FindRelatedRecord
    );
  });

  test('findRelatedRecord + options', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecord({ type: 'moon', id: '123' }, 'planet')
        .options({ url: '/test' })
        .toQueryExpression(),
      {
        op: 'findRelatedRecord',
        record: {
          id: '123',
          type: 'moon'
        },
        relationship: 'planet',
        options: { url: '/test' }
      } as FindRelatedRecord
    );
  });

  test('findRelatedRecords', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons'
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + options', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .options({ url: '/test' })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        options: { url: '/test' }
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + attribute filter', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .filter({ attribute: 'name', value: 'Pluto' })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        filter: [
          {
            op: 'equal',
            kind: 'attribute',
            attribute: 'name',
            value: 'Pluto'
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + attribute filters', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .filter(
          { attribute: 'atmosphere', value: true },
          { attribute: 'classification', value: 'terrestrial' }
        )
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
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
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + filter (invalid filter expression)', function (assert) {
    assert.throws(() => {
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        // testing a common mistake for a new Orbiteer not using TypeScript
        .filter({ name: 'Pluto' } as any)
        .toQueryExpression();
    }, new Error('Unrecognized `filter` param encountered while building query expression'));
  });

  test('findRelatedRecords + attribute filter', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .filter({ attribute: 'name', value: 'Pluto' })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        filter: [
          {
            op: 'equal',
            kind: 'attribute',
            attribute: 'name',
            value: 'Pluto'
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + hasOne filter', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .filter({ relation: 'star', record: { id: '1', type: 'star' } })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        filter: [
          {
            op: 'equal',
            kind: 'relatedRecord',
            relation: 'star',
            record: { id: '1', type: 'star' }
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + hasMany filter', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .filter({
          relation: 'moons',
          records: [
            { id: '1', type: 'moon' },
            { id: '2', type: 'moon' }
          ],
          op: 'equal'
        })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        filter: [
          {
            op: 'equal',
            kind: 'relatedRecords',
            relation: 'moons',
            records: [
              { id: '1', type: 'moon' },
              { id: '2', type: 'moon' }
            ]
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + sort (one field, compact)', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .sort('name')
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + sort (one field descending, compact)', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .sort('-name')
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'descending'
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + sort (multiple fields, compact)', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .sort('name', 'age')
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
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
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + sort (one field, verbose)', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .sort({ attribute: 'name' })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + sort (one field, specified order, verbose)', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .sort({ attribute: 'name', order: 'ascending' })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        sort: [
          {
            kind: 'attribute',
            attribute: 'name',
            order: 'ascending'
          }
        ]
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + sort (one field, specified order, verbose)', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .sort(
          { attribute: 'name', order: 'ascending' },
          { attribute: 'age', order: 'descending' }
        )
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
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
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + sort (invalid sort expression)', function (assert) {
    assert.throws(() => {
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .sort(null as any);
    }, new Error('Unrecognized `sort` param encountered while building query expression'));
  });

  test('findRelatedRecords + page', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .page({ offset: 1, limit: 10 })
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
        page: {
          kind: 'offsetLimit',
          offset: 1,
          limit: 10
        }
      } as FindRelatedRecords
    );
  });

  test('findRelatedRecords + filter + sort + page', function (assert) {
    assert.deepEqual(
      oqb
        .findRelatedRecords({ type: 'planet', id: '123' }, 'moons')
        .filter(
          { attribute: 'name', value: 'Jupiter' },
          { attribute: 'age', value: 23000000 }
        )
        .page({ offset: 1, limit: 10 })
        .sort('-name')
        .toQueryExpression(),
      {
        op: 'findRelatedRecords',
        record: {
          id: '123',
          type: 'planet'
        },
        relationship: 'moons',
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
      } as FindRelatedRecords
    );
  });
});
