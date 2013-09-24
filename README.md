# Orbit.js

Orbit.js is a low level library for keeping data sources coordinated and
synchronized.

Orbit.js has no specific external dependencies, but must be used with a
library that implements the
[Promises/A+](http://promises-aplus.github.io/promises-spec/)
spec, such as [RSVP](https://github.com/tildeio/rsvp.js).

## Interfaces

The primary interfaces provided by Orbit are:

* `Requestable` - for managing requests for data via methods such as `find`,
`create`, `update` and `destoy`.

* `Transformable` - for keeping data sources in sync through low level
transformations.

These interfaces can extend (i.e. be "mixed into") your data sources. They can
be used together or in isolation.

### Requestable

The `Requestable` interface provides a mechanism to define custom "action"
methods on an object or prototype. Actions might typically include `find`,
`create`, `update`, and `destroy`, although the number and names of actions
can be completely customized.

The `Requestable` interface can extend an object or prototype as follows:

```javascript
var source = {};
Requestable.extend(source);
```

This will make your object `Evented` (see below) and create a single action,
`find`, by default. You can also specify alternative actions as follows:

```javascript
var source = {};
Requestable.extend(source, ['find', 'create', 'update', 'destroy']);
```

Or you can add actions later with `Requestable.defineAction()`:

```javascript
var source = {};
Requestable.extend(source); // defines 'find' by default
Requestable.defineAction(source, ['create', 'update', 'destroy']);
Requestable.defineAction(source, 'patch');
```

In order to fulfill the contract of an action, define a
default "handler" method with the name of the action preceded by an underscore
(e.g. `_find`). This handler performs the action and returns a
promise. Here's a simplistic example:

```javascript
source._find = function(type, id) {
  return new RSVP.Promise(function(resolve, reject){
    if (source.data[type] && source.data[type][id]) {
      resolve(source.data[type][id];
    } else {
      reject(type + ' not found');
    }
  });
};
```

Actions combine promise-based return values with an event-driven flow.
Events can be used to coordinate multiple handlers interested in participating
with or simply observing the resolution of an action.

The following events are associated with an action (`find` in this case):

* `assistFind` - triggered prior to calling the default `_find` handler.
Listeners can optionally return a promise. If any promise resolves
successfully, its resolved value will be used as the return value of
`find`, and no further listeners will called.

* `rescueFind` -  if `assistFind` and the default `_find` method fail
to resolve, then `rescueFind` will be triggered. Again, listeners can
optionally return a promise. If any promise resolves successfully,
its resolved value will be used as the return value of `find`, and no further
listeners will called.

* `didFind` - Triggered upon the successful resolution of the action by any
handler. Any promises returned by event listeners will be settled in series
before proceeding.

* `didNotFind` - Triggered when an action can't be resolved by any handler.
Any promises returned by event listeners will be settled in series before
proceeding.

Note that the arguments for actions can be customized for your application.
Orbit will simply pass them through regardless of their number and type. You
will typically want actions of the same name (e.g. `find`) to accept the same
arguments across your data sources.

Let's take a look at how this could all work:

```javascript

// Create some new sources - assume their prototypes are already `Requestable`
var memoryStore = new MemoryStore();
var restStore = new RESTStore();
var localStore = new LocalStore();

////// Connect the sources via events

// Check local storage before making a remote call
restStore.on('assistFind', localStore.find);

// If the in-memory store can't find the record, query our rest server
memoryStore.on('rescueFind', restStore.find);

// Audit success / failure
memoryStore.on('didFind', function(type, id) {
    audit('find', type, id, true);
});
memoryStore.on('didNotFind', function(type, id) {
    audit('find', type, id, false);
});

////// Perform the action

memoryStore.find('contact', 1).then(function(contact) {
  // do something with the contact
}, function(error) {
  // there was a problem
});
```

Configuration can (and probably should) be done well in advance of actions
being called. You essentially want to hook up the wiring between sources and
then restrict your application's direct access to most of them. This greatly
simplifies your application code: instead of chaining together a large number
of promises that include multiple sources in every call,
you can interact with a single source of truth (typically an in-memory store).

### Transformable

Although the `Requestable` interface can help multiple sources coordinate in
fulfilling a request, it's not sufficient to keep data sources synchronized.
When one source fields a request, other sources may need to be notified of
the precise data changes brought about in that source,
so that they can all stay synchronized. That's where the `Transformable`
interace comes in...

COMING SOON!

## Notifications and Events

Orbit also contains a couple classes for handling notifications and events.
These will likely be separated into one or more microlibs.

### Notifier

The `Notifier` class can emit messages to an array of subscribed listeners.
Here's a simple example:

```javascript
var notifier = new Notifier();
notifier.addListener(function(message) {
  console.log("I heard " + message);
});
notifier.addListener(function(message) {
  console.log("I also heard " + message);
});

notifier.emit('hello'); // logs "I heard hello" and "I also heard hello"
```

Notifiers can also poll listeners with an event and return their responses:

```javascript
var dailyQuestion = new Notifier();
dailyQuestion.addListener(function(question) {
  if (question === 'favorite food?') return 'beer';
});
dailyQuestion.addListener(function(question) {
  if (question === 'favorite food?') return 'wasabi almonds';
});
dailyQuestion.addListener(function(question) {
  // this listener doesn't return anything, and therefore won't participate
  // in the poll
});

notifier.poll('favorite food?'); // returns ['beer', 'wasabi almonds']
```

Calls to `emit` and `poll` will send along all of their arguments.

### Evented

The `Evented` interface uses notifiers to add events to an object. Like
notifiers, events will send along all of their arguments to subscribed
listeners.

The `Evented` interface can extend an object or prototype as follows:

```javascript
var source = {};
Evented.extend(source);
```

Listeners can then register themselves for particular events with `on`:

```javascript
var listener1 = function(message) {
      console.log('listener1 heard ' + message);
    },
    listener2 = function(message) {
      console.log('listener2 heard ' + message);
    };

source.on('greeting', listener1);
source.on('greeting', listener2);

evented.emit('greeting', 'hello'); // logs "listener1 heard hello" and
                                   //      "listener2 heard hello"
```

Listeners can be unregistered from events at any time with `off`:

```javascript
source.off('greeting', listener2);
```

A listener can register itself for multiple events at once:

```javascript
source.on('greeting salutation', listener2);
```

And multiple events can be triggered sequentially at once,
assuming that you want to pass them all the same arguments:

```javascript
source.emit('greeting salutation', 'hello', 'bonjour', 'guten tag');
```

Last but not least, listeners can be polled, just like in the notifier example
(note that spaces can't be used in event names):

```javascript
source.on('question', function(question) {
  if (question === 'favorite food?') return 'beer';
});

source.on('question', function(question) {
  if (question === 'favorite food?') return 'wasabi almonds';
});

source.on('question', function(question) {
  // this listener doesn't return anything, and therefore won't participate
  // in the poll
});

source.poll('question', 'favorite food?'); // returns ['beer', 'wasabi almonds']
```

## License

Copyright 2013 Cerebris Corporation. MIT License (see LICENSE for details).
