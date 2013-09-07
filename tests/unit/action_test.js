import RSVP from 'rsvp';
import Evented from 'orbit/evented';
import Action from 'orbit/action';

var object;

var verifyAction = function(actionName) {
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

  test("it should define _" + actionName, function() {
    object['_' + actionName] = successfulOperation;

    object[actionName].call(object).then(function() {
      ok(true, '_' + actionName + ' promise resolved')
    });
  });

  test("it should trigger `will" + ActionName + "` and `did" + ActionName + "` events around a successful action", function() {
    expect(4);

    var order = 0;

    object['_' + actionName] = function() {
      equal(order++, 1, 'action performed after will' + ActionName);
      return successfulOperation();
    };

    object.on('will' + ActionName, function() {
      equal(order++, 0, 'will' + ActionName + ' triggered first');
    });

    object.on('did' + ActionName, function() {
      equal(order++, 2, 'did' + ActionName + ' triggered after action performed');
    });

    object[actionName].call(object).then(function() {
      equal(order++, 3, 'promise resolved after did' + ActionName);
    });
  });

  test("it should trigger `will" + ActionName + "`, but not `did" + ActionName + "`, events for an unsuccessful action", function() {
    expect(3);

    var order = 0;

    object['_' + actionName] = function() {
      equal(order++, 1, 'action performed after will' + ActionName);
      return failedOperation();
    };

    object.on('will' + ActionName, function() {
      equal(order++, 0, 'will' + ActionName + ' triggered first');
    });

    object.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    object[actionName].call(object).then(null, function() {
      equal(order++, 2, 'promise resolved after did' + ActionName);
    });
  });

  test("it should queue actions returned from `will" + ActionName + "` and try them in order until one succeeds", function() {
    expect(6);

    var order = 0;

    var fail = function() {
      equal(order++, 2, 'action performed after will' + ActionName);
      return failedOperation();
    };

    var success = function() {
      equal(order++, 3, 'action performed after failed action');
      return successfulOperation();
    };

    object['_' + actionName] = function() {
      ok(false, 'default action should not be reached');
    };

    object.on('will' + ActionName, function() {
      equal(order++, 0, 'will' + ActionName + ' triggered first');
      return fail;
    });

    object.on('will' + ActionName, function() {
      equal(order++, 1, 'will' + ActionName + ' triggered first');
      return success;
    });

    object.on('did' + ActionName, function() {
      equal(order++, 4, 'did' + ActionName + ' triggered after successful action performed');
    });

    object[actionName].call(object).then(function() {
      equal(order++, 5, 'promise resolved after did' + ActionName);
    });
  });

  test("it should queue actions returned from `will" + ActionName + "` and fail if they all fail", function() {
    expect(6);

    var order = 0;

    var fail = function() {
      equal(order++, 2, 'action performed after will' + ActionName);
      return failedOperation();
    };

    var fail2 = function() {
      equal(order++, 3, 'action performed after will' + ActionName);
      return failedOperation();
    };

    object['_' + actionName] = function() {
      equal(order++, 4, 'default action performed after second failed action');
      return failedOperation();
    };

    object.on('will' + ActionName, function() {
      equal(order++, 0, 'will' + ActionName + ' triggered first');
      return fail;
    });

    object.on('will' + ActionName, function() {
      equal(order++, 1, 'will' + ActionName + ' triggered again');
      return fail2;
    });

    object.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be reached');
    });

    object[actionName].call(object).then(
      function() {
        ok(false, 'promise should not succeed');
      },
      function() {
        equal(order++, 5, 'promise failed because no actions succeeded');
      }
    );
  });
};

module("Unit - Action", {
  setup: function() {
    object = {};
    Evented.extend(object);
    Action.define(object, 'doSomething')
  },

  teardown: function() {
    object = null;
  }
});

verifyAction('doSomething');
