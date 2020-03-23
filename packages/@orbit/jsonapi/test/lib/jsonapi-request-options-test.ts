import { mergeJSONAPIRequestOptions } from '../../src/lib/jsonapi-request-options';

const { module, test } = QUnit;

module('JSONAPIRequestOptions', function() {
  module('mergeJSONAPIRequestOptions', function() {
    const OPTIONS = {
      filter: [{ foo: 'bar' }],
      include: ['baz.bay']
    };

    test('merge empty options', function(assert) {
      assert.deepEqual(mergeJSONAPIRequestOptions(OPTIONS, {}), OPTIONS);
    });

    test('add sort', function(assert) {
      assert.deepEqual(mergeJSONAPIRequestOptions(OPTIONS, { sort: ['qay'] }), {
        filter: [{ foo: 'bar' }],
        include: ['baz.bay'],
        sort: ['qay']
      });
    });

    test('merge includes', function(assert) {
      assert.deepEqual(
        mergeJSONAPIRequestOptions(OPTIONS, {
          include: ['baz.bay', 'snoop.dog']
        }),
        {
          filter: [{ foo: 'bar' }],
          include: ['baz.bay', 'snoop.dog']
        }
      );
    });

    test('merge filters', function(assert) {
      assert.deepEqual(
        mergeJSONAPIRequestOptions(OPTIONS, {
          filter: [{ intelligence: 'low' }]
        }),
        {
          filter: [{ foo: 'bar' }, { intelligence: 'low' }],
          include: ['baz.bay']
        }
      );
    });

    test('override filter', function(assert) {
      assert.deepEqual(
        mergeJSONAPIRequestOptions(OPTIONS, { filter: [{ foo: 'zaz' }] }),
        {
          filter: [{ foo: 'zaz' }],
          include: ['baz.bay']
        }
      );
    });

    test('add page', function(assert) {
      assert.deepEqual(
        mergeJSONAPIRequestOptions(OPTIONS, {
          page: {
            kind: 'offsetLimit',
            offset: 5,
            limit: 100
          }
        }),
        {
          filter: [{ foo: 'bar' }],
          include: ['baz.bay'],
          page: {
            kind: 'offsetLimit',
            offset: 5,
            limit: 100
          }
        }
      );
    });
  });
});
