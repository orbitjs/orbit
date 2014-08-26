import Orbit from 'orbit/main';
import Requestable from 'orbit/requestable';
import { Promise } from 'rsvp';

var source;

var testRequestableAction = function(actionName) {
  var ActionName = actionName.charAt(0).toUpperCase() + actionName.slice(1);

  var successfulOperation = function() {
    return new Promise(function(resolve, reject) {
      resolve(':)');
    });
  };

  var failedOperation = function() {
    return new Promise(function(resolve, reject) {
      reject(':(');
    });
  };

  test("it should require the definition of _" + actionName, function() {
    throws(source[actionName], "presence of _" + actionName + " should be verified");
  });

  test("it should require that _" + actionName + " returns a promise", function() {
    expect(2);

    source['_' + actionName] = successfulOperation;

    stop();
    source[actionName]().then(function(result) {
      start();
      ok(true, '_' + actionName + ' promise resolved');
      equal(result, ':)', 'success!');
    });
  });

  test("it should resolve as a failure when _" + actionName + " fails", function() {
    source['_' + actionName] = failedOperation;

    stop();
    source[actionName]().then(
      function() {
        start();
        ok(false, '_' + actionName + ' should not be resolved successfully');
      },
      function(result) {
        start();
        ok(true, '_' + actionName + ' promise resolved as a failure');
        equal(result, ':(', 'failure');
      }
    );
  });

  test("it should trigger `did" + ActionName + "` event after a successful action", function() {
    expect(6);

    var order = 0;

    source['_' + actionName] = function() {
      equal(++order, 1, 'action performed after will' + ActionName);
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
      return successfulOperation();
    };

    source.on('did' + ActionName, function() {
      equal(++order, 2, 'did' + ActionName + ' triggered after action performed successfully');
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ':)'], 'event handler args match original call args + return value');
    });

    stop();
    source[actionName]('abc', 'def').then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("`did" + ActionName + "` event should receive results as the last argument, even if they are an array", function() {
    expect(6);

    var order = 0;

    source['_' + actionName] = function() {
      equal(++order, 1, 'action performed after will' + ActionName);
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
      return new Promise(function(resolve, reject) {
        resolve(['a', 'b', 'c']);
      });
    };

    source.on('did' + ActionName, function() {
      equal(++order, 2, 'did' + ActionName + ' triggered after action performed successfully');
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ['a', 'b', 'c']], 'event handler args match original call args + return value');
    });

    stop();
    source[actionName]('abc', 'def').then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      deepEqual(result, ['a', 'b', 'c'], 'success!');
    });
  });

  test("it should trigger `didNot" + ActionName + "` event after an unsuccessful action", function() {
    expect(6);

    var order = 0;

    source['_' + actionName] = function() {
      equal(++order, 1, 'action performed after will' + ActionName);
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
      return failedOperation();
    };

    source.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    source.on('didNot' + ActionName, function() {
      equal(++order, 2, 'didNot' + ActionName + ' triggered after an unsuccessful action');
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ':('], 'event handler args match original call args + return value');
    });

    stop();
    source[actionName]('abc', 'def').then(undefined, function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, ':(', 'failure');
    });
  });

  test("`didNot" + ActionName + "` event should receive errors as the last argument, even if they are an array", function() {
    expect(6);

    var order = 0;

    source['_' + actionName] = function() {
      equal(++order, 1, 'action performed after will' + ActionName);
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
      return new Promise(function(resolve, reject) {
        reject(['O_o', ':(']);
      });
    };

    source.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    source.on('didNot' + ActionName, function() {
      equal(++order, 2, 'didNot' + ActionName + ' triggered after an unsuccessful action');
      deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ['O_o', ':(']], 'event handler args match original call args + return value');
    });

    stop();
    source[actionName]('abc', 'def').then(undefined, function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      deepEqual(result, ['O_o', ':('], 'failure');
    });
  });

  test("it should queue actions returned from `assist" + ActionName + "` and try them in order until one succeeds", function() {
    expect(5);

    var order = 0;

    source.on('assist' + ActionName, function() {
      equal(++order, 1, 'assist' + ActionName + ' triggered first');
      return failedOperation();
    });

    source.on('assist' + ActionName, function() {
      equal(++order, 2, 'assist' + ActionName + ' triggered next');
      return successfulOperation();
    });

    source.on('assist' + ActionName, function() {
      ok(false, 'assist' + ActionName + ' handler should not be called after success');
    });

    source['_' + actionName] = function() {
      ok(false, 'default action should not be reached');
    };

    source.on('did' + ActionName, function() {
      equal(++order, 3, 'did' + ActionName + ' triggered after action performed successfully');
    });

    stop();
    source[actionName]().then(function(result) {
      start();
      equal(++order, 4, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("it should queue actions returned from `assist" + ActionName + "` and fail if they all fail", function() {
    expect(6);

    var order = 0;

    source.on('assist' + ActionName, function() {
      equal(++order, 1, 'assist' + ActionName + ' triggered first');
      return failedOperation();
    });

    source.on('assist' + ActionName, function() {
      equal(++order, 2, 'assist' + ActionName + ' triggered again');
      return failedOperation();
    });

    source['_' + actionName] = function() {
      equal(++order, 3, 'default action performed after second failed action');
      return failedOperation();
    };

    source.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    source.on('didNot' + ActionName, function() {
      equal(++order, 4, 'didNot' + ActionName + ' triggered after action failed');
    });

    stop();
    source[actionName]().then(
      function() {
        start();
        ok(false, 'promise should not succeed');
      },
      function(result) {
        start();
        equal(++order, 5, 'promise failed because no actions succeeded');
        equal(result, ':(', 'failure');
      }
    );
  });

  test("after an unsuccessful action, it should queue actions returned from `rescue" + ActionName + "` and try them in order until one succeeds", function() {
    expect(6);

    var order = 0;

    source['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return failedOperation();
    };

    source.on('rescue' + ActionName, function() {
      equal(++order, 2, 'rescue' + ActionName + ' listener triggered after failed action');
      return failedOperation();
    });

    source.on('rescue' + ActionName, function() {
      equal(++order, 3, 'rescue' + ActionName + ' listener triggered after second failed action');
      return successfulOperation();
    });

    source.on('did' + ActionName, function() {
      equal(++order, 4, 'did' + ActionName + ' triggered after action performed successfully');
    });

    source.on('didNot' + ActionName, function() {
      ok(false, 'didNot' + ActionName + ' should not be triggered');
    });

    stop();
    source[actionName]().then(function(result) {
      start();
      equal(++order, 5, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("after an unsuccessful action, it should queue actions returned from `rescue" + ActionName + "` and fail if they all fail", function() {
    expect(6);

    var order = 0;

    source['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return failedOperation();
    };

    source.on('rescue' + ActionName, function() {
      equal(++order, 2, 'rescue' + ActionName + ' listener triggered after failed action');
      return failedOperation();
    });

    source.on('rescue' + ActionName, function() {
      equal(++order, 3, 'rescue' + ActionName + ' listener triggered after second failed action');
      return failedOperation();
    });

    source.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    source.on('didNot' + ActionName, function() {
      equal(++order, 4, 'didNot' + ActionName + ' triggered because action failed');
    });

    stop();
    source[actionName]().then(
      function() {
        start();
        ok(false, 'promise should not succeed');
      },
      function(result) {
        start();
        equal(++order, 5, 'promise failed because no actions succeeded');
        equal(result, ':(', 'failure');
      }
    );
  });
};

var verifyActionExists = function(source, name) {
  ok(source[name], 'action exists');
};

///////////////////////////////////////////////////////////////////////////////

module("Orbit - Requestable", {
  setup: function() {
    Orbit.Promise = Promise;
    source = {};
    Requestable.extend(source);
  },

  teardown: function() {
    source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("it should mixin Evented", function() {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(source[prop], 'should have Evented properties');
  });
});

test("it defines `find` as an action by default", function() {
  verifyActionExists(source, 'find');
});

test("#extend - can define any number of custom actions", function() {
  var requestable = {},
      customActions = ['find', 'add', 'update', 'remove'];

  Requestable.extend(requestable, customActions);

  customActions.forEach(function(action) {
    verifyActionExists(requestable, action);
  });
});

test("#defineAction - can define one or more custom actions", function() {
  var customActions = ['link', 'unlink'];
  Requestable.defineAction(source, customActions);

  customActions.forEach(function(action) {
    verifyActionExists(source, action);
  });

  Requestable.defineAction(source, 'add');
  verifyActionExists(source, 'add');
});

testRequestableAction('find');
