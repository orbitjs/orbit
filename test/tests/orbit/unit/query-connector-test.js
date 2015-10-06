import Orbit from 'orbit/main';
import Queryable from 'orbit/queryable';
import QueryConnector from 'orbit/query-connector';
import { Promise } from 'rsvp';
import { successfulOperation, failedOperation } from 'tests/test-helper';

var primarySource,
    secondarySource,
    queryConnector;

module("Orbit - QueryConnector", {
  setup: function() {
    Orbit.Promise = Promise;

    primarySource = {};
    Queryable.extend(primarySource);

    secondarySource = {};
    Queryable.extend(secondarySource);
  },

  teardown: function() {
    if (queryConnector) {
      queryConnector.deactivate();
    }

    primarySource = null;
    secondarySource = null;
    queryConnector = null;

    Orbit.Promise = null;
  }
});

test("a QueryConnector in `rescue` mode should call the primary source and, if successful, should not call the secondary source", function() {
  expect(4);

  queryConnector = new QueryConnector(primarySource,
                                      secondarySource,
                                      {mode: 'rescue'});

  var order = 0;

  primarySource._query = function() {
    equal(++order, 1, '_query triggered first');
    return successfulOperation();
  };

  secondarySource._query = function() {
    ok(false, '_query should not be triggered on the secondary source');
  };

  primarySource.on('didQuery', function() {
    equal(++order, 2, 'didQuery triggered after action performed successfully');
  });

  primarySource.on('didNotQuery', function() {
    ok(false, 'didNotQuery should not be triggered');
  });

  stop();
  primarySource.query().then(function(result) {
    start();
    equal(++order, 3, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("a QueryConnector in `rescue` mode should call the secondary source after an unsuccessful action on the primary source", function() {
  expect(6);

  queryConnector = new QueryConnector(primarySource,
                                      secondarySource,
                                      {mode: 'rescue'});

  var order = 0;

  primarySource._query = function() {
    equal(++order, 1, '_query triggered first');
    return failedOperation();
  };

  secondarySource._query = function() {
    equal(++order, 2, '_query triggered next');
    return successfulOperation();
  };

  secondarySource.on('didQuery', function() {
    equal(++order, 3, 'didQuery triggered after action performed successfully');
  });

  primarySource.on('didQuery', function() {
    equal(++order, 4, 'didQuery triggered after action performed successfully');
  });

  primarySource.on('didNotQuery', function() {
    ok(false, 'didNotQuery should not be triggered');
  });

  stop();
  primarySource.query().then(function(result) {
    start();
    equal(++order, 5, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("a QueryConnector in `assist` mode should call the secondary source before any action on the primary source", function() {
  expect(5);

  queryConnector = new QueryConnector(primarySource,
                                      secondarySource,
                                      {mode: 'assist'});

  var order = 0;

  secondarySource._query = function() {
    equal(++order, 1, '_query triggered first');
    return successfulOperation();
  };

  primarySource._query = function() {
    ok(false, '_query should not be triggered on the primary source');
  };

  secondarySource.on('didQuery', function() {
    equal(++order, 2, 'didQuery triggered after action performed successfully');
  });

  primarySource.on('didQuery', function() {
    equal(++order, 3, 'didQuery triggered after action performed successfully');
  });

  primarySource.on('didNotQuery', function() {
    ok(false, 'didNotQuery should not be triggered');
  });

  stop();
  primarySource.query().then(function(result) {
    start();
    equal(++order, 4, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("a QueryConnector in `assist` mode should call the secondary source, and if unsuccessful, the primary source will be called", function() {
  expect(6);

  queryConnector = new QueryConnector(primarySource,
                                      secondarySource,
                                      {mode: 'assist'});

  var order = 0;

  secondarySource._query = function() {
    equal(++order, 1, '_query on the secondary source triggered first');
    return failedOperation();
  };

  secondarySource.on('didNotQuery', function() {
    equal(++order, 2, 'didNotQuery triggered after action failed on the secondary source');
  });

  primarySource._query = function() {
    equal(++order, 3, '_query on the primary source triggered first');
    return successfulOperation();
  };

  primarySource.on('didQuery', function() {
    equal(++order, 4, 'didQuery triggered after action performed successfully');
  });

  primarySource.on('didNotQuery', function() {
    ok(false, 'didNotQuery should not be triggered');
  });

  stop();
  primarySource.query().then(function(result) {
    start();
    equal(++order, 5, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});
