import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import Operation from 'orbit/operation';
import { all, Promise } from 'rsvp';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import { equalOps } from 'tests/test-helper';

var schema;

module("OC - Source", {
  setup: function() {
    Orbit.Promise = Promise;

    schema = new Schema({
      models: {
        planet: {}
      }
    });
  },

  teardown: function() {
    schema = null;
    Orbit.Promise = null;
  }
});

test("calls Source.created when a source has been created", function() {
  expect(1);

  var created = sinon.spy(Source, 'created');

  var source = new Source({schema: schema});
  ok(created.calledWith(source), 'Called Source.created with source');

  created.restore();
});

test("will be created without a cache by default", function() {
  var source = new Source({schema: schema});
  equal(source.cache, null);
});

test("can be created with a cache with `useCache`, and options can be specified with `cacheOptions`", function() {
  var source = new Source({schema: schema, useCache: true, cacheOptions: {processors: [CacheIntegrityProcessor, SchemaConsistencyProcessor]}});
  ok(source.cache, 'cache exists');
  equal(source.cache._processors.length, 2, 'cache has 2 processors');
});

test("#prepareTransformOperations - for `add` operations, applies a differential if the target path exists", function() {
  expect(1);

  var source = new Source({schema: schema, useCache: true, cacheOptions: {processors: [CacheIntegrityProcessor, SchemaConsistencyProcessor]}});

  var op = new Operation({
    op: 'add',
    path: ['planet', '1'],
    value: {id: 1, name: 'Earth', hasRings: false}
  });

  source.retrieve = function() {
    return {
      id: 1,
      name: 'Saturn',
      hasRings: true
    };
  };

  var result = source.prepareTransformOperations([op]);
  equalOps(result, [{op: 'replace', path: 'planet/1/name', value: 'Earth'},
                    {op: 'replace', path: 'planet/1/hasRings', value: false}]);
});

test("#prepareTransformOperations - for `replace` operations, applies a differential if the target path exists", function() {
  expect(1);

  var source = new Source({schema: schema, useCache: true, cacheOptions: {processors: [CacheIntegrityProcessor, SchemaConsistencyProcessor]}});

  var op = new Operation({
    op: 'replace',
    path: ['planet', '1', 'hasRings'],
    value: true
  });

  source.retrieve = function() {
    return false;
  };

  var result = source.prepareTransformOperations([op]);
  equalOps(result, [{op: 'replace', path: 'planet/1/hasRings', value: true}]);
});
