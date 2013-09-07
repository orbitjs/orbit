import Requestable from 'orbit/requestable';

var requestable;

module("Unit - Requestable", {
  setup: function() {
    requestable = {};
    Requestable.extend(requestable);
  },

  teardown: function() {
    requestable = null;
  }
});

var verifyAction = function(object, action) {
  ok(object[action], "has the required action " + action);
};

test("it exists", function() {
  ok(requestable);
});

test("it defines `find` as an action by default", function() {
  verifyAction(requestable, 'find');
});

test("it can define any number of custom actions", function() {
  var customRequestable = {},
      customActions = ['find', 'create', 'update', 'destroy'];

  Requestable.extend(customRequestable, customActions);

  customActions.forEach(function(action) {
    verifyAction(customRequestable, action);
  });
});
