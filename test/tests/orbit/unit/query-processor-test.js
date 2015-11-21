import { Class } from 'orbit/lib/objects';
import QueryProcessor from 'orbit/query-processor';
import { QueryProcessorNotFoundException } from 'orbit/lib/exceptions';
import { successfulOperation, failedOperation } from 'tests/test-helper';

let Source, source;

module("Orbit - QueryProcessor", {
  setup: function() {
    Source = Class.extend(QueryProcessor);
    source = new Source();
  },

  teardown: function() {
    Source = source = null;
  }
});

test("it exists", function(assert) {
  assert.ok(source);
});

test("it allows query processors to be registered and unregistered", function(assert) {
  assert.expect(3);

  assert.equal(source.queryProcessors.length, 0, 'no query processors are registered by default');

  source.registerQueryProcessor('fetch', (query) => {});
  source.registerQueryProcessor('orbitql', (query) => {});

  assert.equal(source.queryProcessors.length, 2, 'two query processors have been registered');

  source.unregisterQueryProcessor('fetch');
  source.unregisterQueryProcessor('orbitql');

  assert.equal(source.queryProcessors.length, 0, 'query processors have been unregistered');
});

test("#processQuery throws a QueryProcessorNotFoundException if no query processor is registered", function(assert) {
  assert.expect(1);

  source.registerQueryProcessor('fetch', (query) => {});

  assert.throws(
    function() {
      source.processQuery({bogus: ''});
    },
    'bogus query type'
  );
});

test("#processQuery should resolve successfully with the result returned by a query processor success", function() {
  expect(2);

  source.registerQueryProcessor('fetch', (query) => {
    return successfulOperation();
  });

  stop();
  source.processQuery({fetch: ''})
    .then(function(result) {
      start();
      ok(true, 'query processor promise resolved');
      equal(result, ':)', 'success!');
    });
});

test("#processQuery should resolve as a failure with the error returned by a query processor failure", function() {
  expect(2);

  source.registerQueryProcessor('fetch', (query) => {
    return failedOperation();
  });

  stop();
  source.processQuery({fetch: ''})
    .then(
      function() {
        start();
        ok(false, 'query should not resolve successfully');
      },
      function(result) {
        start();
        ok(true, 'query promise resolved as a failure');
        equal(result, ':(', 'failure');
      }
    );
});
