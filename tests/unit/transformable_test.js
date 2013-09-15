import Transformable from 'orbit/transformable';
import RSVP from 'rsvp';

var source;

var testTransformableAction = function(actionName) {
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
    throws(source[actionName], "presence of _" + actionName + " should be verified");
  });


  test("it should require that _" + actionName + " returns a promise", function() {
    expect(2);

    source['_' + actionName] = successfulOperation;

    stop();
    source[actionName]().then(function(result) {
      start();
      ok(true, '_' + actionName + ' promise resolved')
      equal(result, ':)', 'success!');
    });
  });

  test("it should trigger `will" + ActionName + "` and `did" + ActionName + "` events around a successful action", function() {
    expect(8);

    var order = 0;

    source.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
      deepEqual(toArray(arguments), ['abc', 'def'], 'event handler args match original call args');
    });

    source['_' + actionName] = function() {
      equal(++order, 2, 'action performed after will' + ActionName);
      deepEqual(toArray(arguments), ['abc', 'def'], '_handler args match original call args');
      return successfulOperation();
    };

    source.on('did' + ActionName, function() {
      equal(++order, 3, 'did' + ActionName + ' triggered after action performed successfully');
      deepEqual(toArray(arguments), ['abc', 'def', ':)'], 'event handler args match original call args + return value');
    });

    stop();
    source[actionName]('abc', 'def').then(function(result) {
      start();
      equal(++order, 4, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("it should trigger `will" + ActionName + "` and `didNot" + ActionName + "` events for an unsuccessful action", function() {
    expect(8);

    var order = 0;

    source.on('will' + ActionName, function() {
      equal(++order, 1, 'will' + ActionName + ' triggered first');
      deepEqual(toArray(arguments), ['abc', 'def'], 'event handler args match original call args');
    });

    source['_' + actionName] = function() {
      equal(++order, 2, 'action performed after will' + ActionName);
      deepEqual(toArray(arguments), ['abc', 'def'], '_handler args match original call args');
      return failedOperation();
    };

    source.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    source.on('didNot' + ActionName, function() {
      equal(++order, 3, 'didNot' + ActionName + ' triggered after an unsuccessful action');
      deepEqual(toArray(arguments), ['abc', 'def', ':('], 'event handler args match original call args + return value');
    });

    stop();
    source[actionName]('abc', 'def').then(null, function(result) {
      start();
      equal(++order, 4, 'promise resolved last');
      equal(result, ':(', 'failure');
    });
  });
};

var verifyActionExists = function(source, name) {
  ok(source[name], 'action exists');
};

///////////////////////////////////////////////////////////////////////////////

module("Unit - Transformable", {
  setup: function() {
    source = {};
    Transformable.extend(source);
  },

  teardown: function() {
    source = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("it should mixin Evented", function() {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(source[prop], 'should have Evented properties');
  })
});

test("it defines `transform` as an action by default", function() {
  verifyActionExists(source, 'transform');
});

test("it can define any number of custom actions", function() {
  var transformable = {},
      customActions = ['find', 'create', 'update', 'destroy'];

  Transformable.extend(transformable, customActions);

  customActions.forEach(function(action) {
    verifyActionExists(transformable, action);
  });
});

testTransformableAction('transform');
