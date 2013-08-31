import Publisher from 'orbit/publisher';

module("Unit - Publisher", {

});

test("it exists", function() {
  ok(Publisher);
});

test("it maintains a list of subscribers", function() {
  var publisher = new Publisher(),
      subscriber1 = function() {},
      subscriber2 = function() {};

  equal(publisher.subscribers.length, 0);

  publisher.addSubscriber(subscriber1);
  publisher.addSubscriber(subscriber2);
  equal(publisher.subscribers.length, 2);

  publisher.removeSubscriber(subscriber1);
  equal(publisher.subscribers.length, 1);

  publisher.removeSubscriber(subscriber2);
  equal(publisher.subscribers.length, 0);
});

test("it notifies subscribers when publishing a simple message", function() {
  expect(2);

  var publisher = new Publisher(),
      subscriber1 = function(message) {
        equal(message, 'hello');
      },
      subscriber2 = function(message) {
        equal(message, 'hello');
      };

  publisher.addSubscriber(subscriber1);
  publisher.addSubscriber(subscriber2);

  publisher.publish('hello');
});

test("it notifies subscribers when publishing any number of arguments", function() {
  expect(4);

  var publisher = new Publisher(),
      subscriber1 = function() {
        equal(arguments[0], 'hello');
        equal(arguments[1], 'world');
      },
      subscriber2 = function() {
        equal(arguments[0], 'hello');
        equal(arguments[1], 'world');
      };

  publisher.addSubscriber(subscriber1);
  publisher.addSubscriber(subscriber2);

  publisher.publish('hello', 'world');
});