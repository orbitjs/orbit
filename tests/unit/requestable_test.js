import Requestable from 'orbit/requestable';
import RSVP from 'rsvp';

var object;

var testActionBehavior = function(actionName) {
  var ActionName = actionName.charAt(0).toUpperCase() + actionName.slice(1);

  var successfulOperation = function() {
    stop();
    return new RSVP.Promise(function(resolve, reject) {
      start();
      resolve();
    });
  };

  var failedOperation = function() {
    stop();
    return new RSVP.Promise(function(resolve, reject) {
      start();
      reject();
    });
  };

  test("it should require that _" + actionName + " returns a promise", function() {
    object['_' + actionName] = successfulOperation;

    object[actionName].call(object).then(function() {
      ok(true, '_' + actionName + ' promise resolved')
    });
  });

  test("it should resolve as a failure when _" + actionName + " fails", function() {
    object['_' + actionName] = failedOperation;

    object[actionName].call(object).then(
      function() {
        ok(false, '_' + actionName + ' should not be resolved successfully')
      },
      function() {
        ok(true, '_' + actionName + ' promise resolved as a failure')
      }
    );
  });

  test("it should trigger `will" + ActionName + "` and `did" + ActionName + "` events around a successful action", function() {
    expect(5);

    var order = 0;

    object['_' + actionName] = function() {
      equal(++order, 2, 'action performed after will' + ActionName);
      return successfulOperation();
    };

    object.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
    });

    object.on('did' + ActionName, function() {
      equal(++order, 3, 'did' + ActionName + ' triggered after action performed successfully');
    });

    object.on('after' + ActionName, function() {
      equal(++order, 4, 'after' + ActionName + ' triggered after any action performed');
    });

    object[actionName].call(object).then(function() {
      equal(++order, 5, 'promise resolved after did' + ActionName);
    });
  });

  test("it should trigger `will" + ActionName + "`, but not `did" + ActionName + "`, events for an unsuccessful action", function() {
    expect(4);

    var order = 0;

    object['_' + actionName] = function() {
      equal(++order, 2, 'action performed after will' + ActionName);
      return failedOperation();
    };

    object.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
    });

    object.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    object.on('after' + ActionName, function() {
      equal(++order, 3, 'after' + ActionName + ' triggered after any action performed successfully');
    });

    object[actionName].call(object).then(null, function() {
      equal(++order, 4, 'promise resolved after did' + ActionName);
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

    object.on('after' + ActionName, function() {
      equal(++order, 6, 'after' + ActionName + ' triggered after any action performed');
    });

    object[actionName].call(object).then(function() {
      equal(++order, 7, 'promise resolved after did' + ActionName);
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

    object['_' + actionName] = function() {
      equal(++order, 5, 'default action performed after second failed action');
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

    object.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    object.on('after' + ActionName, function() {
      equal(++order, 6, 'after' + ActionName + ' triggered after any action performed');
    });

    object[actionName].call(object).then(
      function() {
        ok(false, 'promise should not succeed');
      },
      function() {
        equal(++order, 7, 'promise failed because no actions succeeded');
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

    object.on('after' + ActionName, function() {
      equal(++order, 7, 'after' + ActionName + ' triggered after any action performed');
    });

    object[actionName].call(object).then(function() {
      equal(++order, 8, 'promise resolved after did' + ActionName);
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

    object.on('after' + ActionName, function() {
      equal(++order, 7, 'after' + ActionName + ' triggered after any action performed');
    });

    object[actionName].call(object).then(
      function() {
        ok(false, 'promise should not succeed');
      },
      function() {
        equal(++order, 8, 'promise failed because no actions succeeded');
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
