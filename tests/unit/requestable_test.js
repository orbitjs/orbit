import Requestable from 'orbit/requestable';
import RSVP from 'rsvp';

var object;

var testActionBehavior = function(actionName) {
  var ActionName = actionName.charAt(0).toUpperCase() + actionName.slice(1);

  var successfulOperation = function() {
    return new RSVP.Promise(function(resolve, reject) {
      resolve(':)');
    });
  };

  var failedOperation = function() {
    return new RSVP.Promise(function(resolve, reject) {
      reject(':(');
    });
  };

  test("it should require the definition of _" + actionName, function() {
    throws(object[actionName], "presence of _" + actionName + " should be verified");
  });

  test("it should require that _" + actionName + " returns a promise", function() {
    expect(2);

    object['_' + actionName] = successfulOperation;

    stop();
    object[actionName]().then(function(result) {
      start();
      ok(true, '_' + actionName + ' promise resolved')
      equal(result, ':)', 'success!');
    });
  });

  test("it should resolve as a failure when _" + actionName + " fails", function() {
    object['_' + actionName] = failedOperation;

    stop();
    object[actionName]().then(
      function() {
        start();
        ok(false, '_' + actionName + ' should not be resolved successfully')
      },
      function(result) {
        start();
        ok(true, '_' + actionName + ' promise resolved as a failure')
        equal(result, ':(', 'failure');
      }
    );
  });

  test("it should trigger `will" + ActionName + "` and `did" + ActionName + "` events around a successful action", function() {
    expect(8);

    var order = 0;

    object.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
      deepEqual(toArray(arguments), ['abc', 'def'], 'event handler args match original call args');
    });

    object['_' + actionName] = function() {
      equal(++order, 2, 'action performed after will' + ActionName);
      deepEqual(toArray(arguments), ['abc', 'def'], '_handler args match original call args');
      return successfulOperation();
    };

    object.on('did' + ActionName, function() {
      equal(++order, 3, 'did' + ActionName + ' triggered after action performed successfully');
      deepEqual(toArray(arguments), ['abc', 'def', ':)'], 'event handler args match original call args + return value');
    });

    stop();
    object[actionName]('abc', 'def').then(function(result) {
      start();
      equal(++order, 4, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("it should trigger `will" + ActionName + "` and `didNot" + ActionName + "` events for an unsuccessful action", function() {
    expect(8);

    var order = 0;

    object.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
      deepEqual(toArray(arguments), ['abc', 'def'], 'event handler args match original call args');
    });

    object['_' + actionName] = function() {
      equal(++order, 2, 'action performed after will' + ActionName);
      deepEqual(toArray(arguments), ['abc', 'def'], '_handler args match original call args');
      return failedOperation();
    };

    object.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    object.on('didNot' + ActionName, function() {
      equal(++order, 3, 'didNot' + ActionName + ' triggered after an unsuccessful action');
      deepEqual(toArray(arguments), ['abc', 'def', ':('], 'event handler args match original call args + return value');
    });

    stop();
    object[actionName]('abc', 'def').then(null, function(result) {
      start();
      equal(++order, 4, 'promise resolved last');
      equal(result, ':(', 'failure');
    });
  });

  test("it should queue actions returned from `will" + ActionName + "` and try them in order until one succeeds", function() {
    expect(7);

    var order = 0;

    var fail = function() {
      equal(++order, 3, 'action performed after will' + ActionName);
      return failedOperation();
    };

    var success = function() {
      equal(++order, 4, 'action performed after failed action');
      return successfulOperation();
    };

    object['_' + actionName] = function() {
      ok(false, 'default action should not be reached');
    };

    object.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
      return fail;
    });

    object.on('will' + ActionName, function() {
      equal(++order, 2, 'will' + ActionName + ' triggered first');
      return success;
    });

    object.on('did' + ActionName, function() {
      equal(++order, 5, 'did' + ActionName + ' triggered after action performed successfully');
    });

    stop();
    object[actionName]().then(function(result) {
      start();
      equal(++order, 6, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("it should queue actions returned from `will" + ActionName + "` and fail if they all fail", function() {
    expect(7);

    var order = 0;

    var fail = function() {
      equal(++order, 3, 'action performed after will' + ActionName);
      return failedOperation();
    };

    var fail2 = function() {
      equal(++order, 4, 'action performed after will' + ActionName);
      return failedOperation();
    };

    object.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
      return fail;
    });

    object.on('will' + ActionName, function() {
      equal(++order, 2, 'will' + ActionName + ' triggered again');
      return fail2;
    });

    object['_' + actionName] = function() {
      equal(++order, 5, 'default action performed after second failed action');
      return failedOperation();
    };

    object.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    stop();
    object[actionName]().then(
      function() {
        start();
        ok(false, 'promise should not succeed');
      },
      function(result) {
        start();
        equal(++order, 6, 'promise failed because no actions succeeded');
        equal(result, ':(', 'failure');
      }
    );
  });

  test("after an unsuccessful action, it should queue actions returned from `rescue" + ActionName + "` and try them in order until one succeeds", function() {
    expect(8);

    var order = 0;

    var fail = function() {
      equal(++order, 4, 'action performed after polling with didNot' + ActionName);
      return failedOperation();
    };

    var success = function() {
      equal(++order, 5, 'action performed after polling with didNot' + ActionName);
      return successfulOperation();
    };

    object['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return failedOperation();
    };

    object.on('rescue' + ActionName, function() {
      equal(++order, 2, 'rescue' + ActionName + ' listener triggered after failed action');
      return fail;
    });

    object.on('rescue' + ActionName, function() {
      equal(++order, 3, 'rescue' + ActionName + ' listener triggered after second failed action');
      return success;
    });

    object.on('did' + ActionName, function() {
      equal(++order, 6, 'did' + ActionName + ' triggered after action performed successfully');
    });

    object.on('didNot' + ActionName, function() {
      ok(false, 'didNot' + ActionName + ' should not be triggered');
    });

    stop();
    object[actionName]().then(function(result) {
      start();
      equal(++order, 7, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("after an unsuccessful action, it should queue actions returned from `rescue" + ActionName + "` and fail if they all fail", function() {
    expect(8);

    var order = 0;

    var fail1 = function() {
      equal(++order, 4, '1st action performed after polling with didNot' + ActionName);
      return failedOperation();
    };

    var fail2 = function() {
      equal(++order, 5, '2nd action performed after polling with didNot' + ActionName);
      return failedOperation();
    };

    object['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return failedOperation();
    };

    object.on('rescue' + ActionName, function() {
      equal(++order, 2, 'rescue' + ActionName + ' listener triggered after failed action');
      return fail1;
    });

    object.on('rescue' + ActionName, function() {
      equal(++order, 3, 'rescue' + ActionName + ' listener triggered after second failed action');
      return fail2;
    });

    object.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    object.on('didNot' + ActionName, function() {
      equal(++order, 6, 'didNot' + ActionName + ' triggered because action failed');
    });

    stop();
    object[actionName]().then(
      function() {
        start();
        ok(false, 'promise should not succeed');
      },
      function(result) {
        start();
        equal(++order, 7, 'promise failed because no actions succeeded');
        equal(result, ':(', 'failure');
      }
    );
  });
};

var verifyActionExists = function(object, name) {
  ok(object[name], 'action exists');
};

///////////////////////////////////////////////////////////////////////////////

module("Unit - Requestable", {
  setup: function() {
    object = {};
    Requestable.extend(object);
  },

  teardown: function() {
    object = null;
  }
});

test("it exists", function() {
  ok(object);
});

test("it should mixin Evented", function() {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(object[prop], 'should have Evented properties');
  })
});

test("it defines `find` as an action by default", function() {
  verifyActionExists(object, 'find');
});

test("it can define any number of custom actions", function() {
  var requestable = {},
      customActions = ['find', 'create', 'update', 'destroy'];

  Requestable.extend(requestable, customActions);

  customActions.forEach(function(action) {
    verifyActionExists(requestable, action);
  });
});

testActionBehavior('find');
