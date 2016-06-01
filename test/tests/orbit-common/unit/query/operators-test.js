import {
  recordsOfType,
  record,
  relatedRecord,
  relatedRecords,
  or,
  and
} from 'orbit-common/query/operators';
import { queryExpression as oqe } from 'orbit/query/expression';

module('query/operators', () => {
  const recordIdentity = { type: 'planet', id: '1' };

  test('recordsOfType', assert => {
    assert.deepEqual(
      recordsOfType('planet').toQueryExpression(),
      oqe('recordsOfType', 'planet')
    );
  });

  test('record', assert => {
    assert.deepEqual(
      record(recordIdentity).toQueryExpression(),
      oqe('record', recordIdentity)
    );
  });

  test('key', assert => {
    assert.deepEqual(
      key(recordIdentity, 'name'),
      oqe('key', recordIdentity, 'name')
    );
  });

  test('attribute', assert => {
    assert.deepEqual(
      attribute(recordIdentity, 'name'),
      oqe('attribute', recordIdentity, 'name')
    );
  });

  test('relatedRecord', assert => {
    assert.deepEqual(
      relatedRecord(recordIdentity, 'star').toQueryExpression(),
      oqe('relatedRecord', recordIdentity, 'star')
    );
  });

  test('relatedRecords', assert => {
    assert.deepEqual(
      relatedRecords(recordIdentity, 'moons').toQueryExpression(),
      oqe('relatedRecords', recordIdentity, 'moons')
    );
  });

  test('or', assert => {
    assert.deepEqual(
      or(
        recordsOfType('planet').toQueryExpression(),
        recordsOfType('moon').toQueryExpression()
      ).toQueryExpression(),
      oqe('or',
        oqe('recordsOfType', 'planet'),
        oqe('recordsOfType', 'moon')
      )
    );
  });

  test('and', assert => {
    assert.deepEqual(
      and(
        recordsOfType('planet').toQueryExpression(),
        recordsOfType('moon').toQueryExpression()
      ).toQueryExpression(),
      oqe('and',
        oqe('recordsOfType', 'planet'),
        oqe('recordsOfType', 'moon')
      )
    );
  });

  test('equal', assert => {
    assert.deepEqual(
      equal(
        recordsOfType('planet').toQueryExpression(),
        recordsOfType('moon').toQueryExpression()
      ).toQueryExpression(),
      oqe('equal',
        oqe('recordsOfType', 'planet'),
        oqe('recordsOfType', 'moon')
      )
    );
  });

  test('filter', assert => {
    assert.deepEqual(
      filter(
        recordsOfType('planet').toQueryExpression(),
        equal(attribute('name').toQueryExpression(), 'Jupiter').toQueryExpression()
      ).toQueryExpression(),
      oqe('filter', 'planet')
    );
  });
});
