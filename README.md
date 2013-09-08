# Orbit.js

Orbit.js is a low level library that can coordinate access to data sources and
keep them effortlessly in sync.

Orbit has no specific external dependencies. However, it does require use of
a library that implements the
[Promises/A+](http://promises-aplus.github.io/promises-spec/) spec,
such as [RSVP](https://github.com/tildeio/rsvp.js).

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

Actions combine promise-based returns with an event-driven flow.
Events can be used to coordinate multiple handlers interested in participating
with or simply observing the resolution of an action.

The following events are associated with an action (`find` in this case):

* `willFind` - triggered prior to calling the default `_find` handler.
Listeners can each optionally respond with an additional handler,
which must be a function that returns a promise. Handlers will be
called successively, prior to `_find`, until one resolves successfully.

* `rescueFind` -  if no handlers queued by `willFind` are successfully
resolved, nor is the default `_find` method itself, then `rescueFind` will be
triggered to allow listeners to respond with handlers that might be able to
resolve the action. Again, these actions will be called successively,
until one resolves or the whole queue fails.

* `didFind` - triggered upon the successful resolution of the action by any
handler.

* `didNotFind` - triggered when an action can't be resolved by any handler.

* `afterFind` - triggered after either `didFind` or `didNotFind`,
indicating the conclusion of an action.

Note that the arguments for actions can be customized for your application.
Orbit will simply pass them through regardless of their number and type. You
will typically want actions of the same name (e.g. `find`) to accept the same
arguments across your data sources.

Let's take a look at how this could all work:

```javascript

// Create some new sources - assume their prototypes are already `Requestable`
var memStore = new InMemoryStore();
var restStore = new RESTStore();
var localStore = new LocalStore();

////// Connect the sources

// Check local storage before making a remote call
restStore.on('willFind', localStore.find);

// If the in-memory store can't find the record, query our rest server
memStore.on('rescueFind', restStore.find);

// Audit success / failure
memStore.on('didFind', function(type, id) {
    audit('find', type, id, true);
});
memStore.on('didNotFind', function(type, id) {
    audit('find', type, id, false);
});

////// Perform the action

memStore.find('contact', 1).then(function(contact) {
  // do something with the contact
}, function(error) {
  // there was a problem
});
```

Note that all of the configuration steps can (and probably should) be done
well in advance of the action being called. You essentially want to hook up the
wiring between sources and focus only on the entry points to your data from
your application, such as an in-memory store. This eliminates the need to
chain together a large number of promises with every call.

### Transformable

COMING SOON!

## Notifications and Events

Orbit also contains a couple classes for handling notifications and events.
These may be separated into one or more microlibs.

### Notifier

### Evented

## License