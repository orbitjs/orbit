# Orbit.js [![Build Status](https://secure.travis-ci.org/orbitjs/orbit.js.png?branch=master)](http://travis-ci.org/orbitjs/orbit.js)

Orbit is a standalone library for coordinating access to data sources
and keeping their contents synchronized.

Orbit provides a foundation for building advanced features in client-side
applications such as offline operation, maintenance and synchronization of local
caches, undo / redo stacks and ad hoc editing contexts.

Orbit relies heavily on promises, events and low-level transforms.

## Goals

* Support any number of different data sources in an application and
  provide access to them through common interfaces.

* Allow for the fulfillment of requests by different sources, including
  the ability to specify priority and fallback plans.

* Allow records to simultaneously exist in different states across sources.

* Coordinate transformations across sources. Handle merges automatically
  where possible but allow for complete custom control.

* Allow for blocking and non-blocking transformations.

* Allow for synchronous and asynchronous requests.

* Support transactions and undo/redo by tracking inverses of operations.

* Work with plain JavaScript objects.

## Dependencies

Orbit.js has no specific external run-time dependencies, but must be used with a
library that implements the
[Promises/A+](http://promises-aplus.github.io/promises-spec/)
spec, such as [RSVP](https://github.com/tildeio/rsvp.js).

## Installation

Orbit can be installed with [Bower](http://bower.io):

```
bower install orbit.js
```

[A separate shim repo](https://github.com/orbitjs/orbit-builds) is
maintained for builds.

## Configuration

You'll need to configure Orbit to recognize any applicable dependencies.

Configure your promise library's `Promise` constructor as follows:

```javascript
Orbit.Promise = RSVP.Promise;
```

If you're using an Orbit source that relies on an `ajax` method (such as
`JSONAPISource`), configure it as follows:

```javascript
Orbit.ajax = jQuery.ajax;
```

Other sources may have other configuration requirements.

## How does Orbit work?

Orbit requires that every data source support one or more common interfaces.
These interfaces define how data can be both *accessed* and *transformed*.

The methods for accessing and transforming data return promises. These promises
might be fulfilled synchronously or asynchronously. Once fulfilled, events
are triggered to indicate success or failure. Any event listeners can engage
with an event by returning a promise. In this way, multiple data sources can be
involved in a single action.

Standard connectors are supplied for listening to events on a data source and
calling corresponding actions on a target. These connectors can be blocking
(i.e. they don't resolve until all associated actions are resolved) or
non-blocking (i.e. associated actions are resolved in the background without
blocking the flow of the application). Connectors can be used to enable
uni or bi-directional flow of data between sources.

## Orbit Common Library

The Orbit Common library (namespaced `OC` by default) contains a set of
compatible data sources, currently including: an in-memory cache, a local
storage source, and a source for accessing [JSON API](http://jsonapi.org/)
compliant APIs with AJAX.

You can define your own data sources that will work with Orbit as long as they
support Orbit's interfaces. You can either make sources compliant with the
Orbit Common library or use Orbit's base interfaces to create an independent
collection of compatible sources.

## Simple Example

```javascript

  // Create data sources with a common schema
  var schema = new OC.Schema({
    keys: {
      __id: { primaryKey: true, defaultValue: Orbit.uuid }
    },
    models: {
      planet: {
        attributes: {
          name: {type: 'string'},
          classification: {type: 'string'}
        }
      }
    }
  });
  var memorySource = new OC.MemorySource(schema);
  var restSource = new OC.JSONAPISource(schema);
  var localSource = new OC.LocalStorageSource(schema);

  // Connect MemorySource -> LocalStorageSource (using the default blocking strategy)
  var memToLocalConnector = new Orbit.TransformConnector(memorySource, localSource);

  // Connect MemorySource <-> JSONAPISource (using the default blocking strategy)
  var memToRestConnector = new Orbit.TransformConnector(memorySource, restSource);
  var restToMemConnector = new Orbit.TransformConnector(restSource, memorySource);

  // Add a record to the memory source
  memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(
    function(planet) {
      console.log('Planet added - ', planet.name, '(id:', planet.id, ')');
    }
  );

  // Log the transforms in all sources
  memorySource.on('didTransform', function(operation, inverse) {
    console.log('memorySource', operation);
  });

  localSource.on('didTransform', function(operation, inverse) {
    console.log('localSource', operation);
  });

  restSource.on('didTransform', function(operation, inverse) {
    console.log('restSource', operation);
  });

  // CONSOLE OUTPUT
  //
  // memorySource {op: 'add', path: 'planet/1', value: {__id: 1, name: 'Jupiter', classification: 'gas giant'}}
  // localSource  {op: 'add', path: 'planet/1', value: {__id: 1, name: 'Jupiter', classification: 'gas giant'}}
  // restSource   {op: 'add', path: 'planet/1', value: {__id: 1, id: 12345, name: 'Jupiter', classification: 'gas giant'}}
  // memorySource {op: 'add', path: 'planet/1/id', value: 12345}
  // localSource  {op: 'add', path: 'planet/1/id', value: 12345}
  // Planet added - Jupiter (id: 12345)
```

In this example, we've created three separate sources and connected them with
transform connectors that are *blocking*. In other words, the promise returned
from an action won't be fulfilled until every event listener that engages with
it (by returning a promise) has been fulfilled.

In this case, we're adding a record to the memory source, which the connectors
help duplicate in both the REST source and local storage. The REST source returns
an `id` from the server, which is then propagated back to the memory source and
then the local storage source.

Note that we could also connect the sources with *non-blocking* connectors with
the `blocking: false` option:

```javascript
  // Connect MemorySource -> LocalStorageSource (non-blocking)
  var memToLocalConnector = new Orbit.TransformConnector(memorySource, localSource, {blocking: false});

  // Connect MemorySource <-> JSONAPISource (non-blocking)
  var memToRestConnector = new Orbit.TransformConnector(memorySource, restSource, {blocking: false});
  var restToMemConnector = new Orbit.TransformConnector(restSource, memorySource, {blocking: false});
```

In this case, the promise generated from `memorySource.add` will be resolved
immediately, after which records will be asynchronously created in the REST
source and local storage. Any differences, such as an `id` returned from the
server, will be automatically patched back to the record in the memory source.

## Interfaces

The primary interfaces provided by Orbit are:

* `Requestable` - for managing requests for data via methods such as `find`,
`create`, `update` and `destroy`.

* `Transformable` - for keeping data sources in sync through low level
transformations which follow the JSON PATCH spec detailed in
[RFC 6902](http://tools.ietf.org/html/rfc6902).

These interfaces can extend (i.e. be "mixed into") your data sources. They can
be used together or in isolation.

### Requestable

The `Requestable` interface provides a mechanism to define custom "action"
methods on an object or prototype. Actions might typically include `find`,
`add`, `update`, `patch` and `remove`, although the number and names of actions
can be completely customized.

The `Requestable` interface can extend an object or prototype as follows:

```javascript
var source = {};
Orbit.Requestable.extend(source);
```

This will make your object `Evented` (see below) and create a single action,
`find`, by default. You can also specify alternative actions as follows:

```javascript
var source = {};
Orbit.Requestable.extend(source, ['find', 'add', 'update', 'patch', 'remove']);
```

Or you can add actions later with `Orbit.Requestable.defineAction()`:

```javascript
var source = {};
Orbit.Requestable.extend(source); // defines 'find' by default
Orbit.Requestable.defineAction(source, ['add', 'update', 'remove']);
Orbit.Requestable.defineAction(source, 'patch');
```

In order to fulfill the contract of an action, define a
default "handler" method with the name of the action preceded by an underscore
(e.g. `_find`). This handler performs the action and returns a
promise. Here's a simplistic example:

```javascript
source._find = function(type, id) {
  return new RSVP.Promise(function(resolve, reject){
    if (source._data[type] && source._data[type][id]) {
      resolve(source._data[type][id]);
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
var memorySource = new OC.MemorySource();
var restSource = new OC.JSONAPISource();
var localSource = new OC.LocalStorageSource();

////// Connect the sources via events

// Check local storage before making a remote call
restSource.on('assistFind', localSource.find);

// If the in-memory source can't find the record, query our rest server
memorySource.on('rescueFind', restSource.find);

// Audit success / failure
memorySource.on('didFind', function(type, id, record) {
    audit('find', type, id, true);
});
memorySource.on('didNotFind', function(type, id, error) {
    audit('find', type, id, false);
});

////// Perform the action

memorySource.find('contact', 1).then(function(contact) {
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
you can interact with a single source of truth (typically an in-memory data
source).

### Transformable

Although the `Requestable` interface can help multiple sources coordinate in
fulfilling a request, it's not sufficient to keep data sources synchronized.
When one source fields a request, other sources may need to be notified of
the precise data changes brought about in that source,
so that they can all stay synchronized. That's where the `Transformable`
interface comes in...

The `Transformable` interface provides a single method, `transform`, which can
be used to change the contents of a source. Transformations must follow the
JSON PATCH spec detailed in
[RFC 6902](http://tools.ietf.org/html/rfc6902).
They must specify an operation (`add`, `remove`, or `replace`), a
path, and a value. For instance, the following transformations add, patch and
then remove a record:

```javascript
{op: 'add', path: 'planet/1', value: {__id: 1, name: 'Jupiter', classification: 'gas giant'}
{op: 'replace', path: 'planet/1/name', value: 'Earth'}
{op: 'remove', path: 'planet/1'}
```

The `Transformable` interface can extend an object or prototype as follows:

```javascript
var source = {};
Orbit.Transformable.extend(source);
```

This will ensure that your source is `Evented` (see below). It also adds a
`transform` method. In order to fulfill the `transform` method, your source
should implement a `_transform` method that performs the transform and returns
a promise if the transformation is asynchronous.

It's important to note that the requested transform may not match the actual
transform applied to a source. Therefore, each source should call `didTransform`
for any transforms that actually take place. This method triggers the
`didTransform` event, which returns the operation and an array of inverse
operations.

`transform` may be called with a single transform operation, or an array of
operations. Any number of `didTransform` events may be triggered as a result.

Transforms will be queued and performed serially in the order requested.

## TransformConnector

A `TransformConnector` watches a transformable source and propagates any
transforms to a transformable target.

Each connector is "one way", so bi-directional synchronization between sources
requires the creation of two connectors.

Connectors can be "blocking" or "non-blocking". The difference is that
"blocking" connectors will return a promise to the `didTransform` event, which
will prevent the original transform from resolving until the promise itself has
resolved. "Non-blocking" transforms do not block the resolution of the original
transform - asynchronous actions are performed afterward.

If the target of a connector is busy processing transformations, then the
connector will queue operations until the target is free. This ensures that the
target's state is as up to date as possible before transformations proceed.

The connector's `transform` method actually applies transforms to its target.
This method attempts to retrieve the current value at the path of the
transformation and resolves any conflicts with the connector's
`resolveConflicts` method. By default, a simple differential is applied to the
target, although both `transform` and `resolveConflicts` can be overridden to
apply an alternative differencing algorithm.

## RequestConnector

A `RequestConnector` observes requests made to a primary source and allows a
secondary source to either "assist" or "rescue" those requests.

The `mode` of a `RequestConnector` can be either `"rescue"` or `"assist"`
(`"rescue"` is the default).

In `"rescue"` mode, the secondary source will only be called upon to fulfill
a request if the primary source fails to do so.

In `"assist"` mode, the secondary source will be called upon to fulfill a
request before the primary source. Only if the secondary source fails to
fulfill the request will the primary source be called upon to do so.

Unlike a `TransformConnector`, a `RequestConnector` always operates in
"blocking" mode. In other words, promises are always settled (either succeeding
or failing) before the connector proceeds.

## Document

`Document` is a complete implementation of the JSON PATCH spec detailed in
[RFC 6902](http://tools.ietf.org/html/rfc6902).

It can be manipulated via a `transform` method that accepts an `operation`, or
with methods `add`, `remove`, `replace`, `move`, `copy` and `test`.

Data at a particular path can be retrieved from a `Document` with `retrieve()`.

## Notifications and Events

Orbit also contains a couple classes for handling notifications and events.
These will likely be separated into one or more microlibs.

### Notifier

The `Notifier` class can emit messages to an array of subscribed listeners.
Here's a simple example:

```javascript
var notifier = new Orbit.Notifier();
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
var dailyQuestion = new Orbit.Notifier();
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

dailyQuestion.poll('favorite food?'); // returns ['beer', 'wasabi almonds']
```

Calls to `emit` and `poll` will send along all of their arguments.

### Evented

The `Evented` interface uses notifiers to add events to an object. Like
notifiers, events will send along all of their arguments to subscribed
listeners.

The `Evented` interface can extend an object or prototype as follows:

```javascript
var source = {};
Orbit.Evented.extend(source);
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

## Contributing

### Installing Orbit

Install the CLI for [Broccoli](https://github.com/broccolijs/broccoli) globally:

```
npm install -g broccoli-cli
```

Install the rest of Orbit's dependencies:

```
npm install
```

### Building Orbit

Distributable versions of Orbit can be built to the `/build` directory by
running:

```
npm run build
```

### Testing Orbit

#### CI Testing

Orbit can be tested in CI mode by running:

```
npm test
```

Or directly with testem (useful for configuring options):

```
testem ci
```

#### Browser Testing

Orbit can be tested within a browser
(at [http://localhost:4200/tests/](http://localhost:4200/tests/)) by running:

```
npm start
```

Or directly with `broccoli` (useful for configuring the port, etc.):

```
broccoli serve
```

### Generating Documentation

Install [yuidoc](http://yui.github.io/yuidoc/) globally:

```
npm install -g yuidocjs
```

Generate docs in the `/docs` directory:

```
yuidoc .
```

## License

Copyright 2014 Cerebris Corporation. MIT License (see LICENSE for details).
