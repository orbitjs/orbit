# Orbit.js [![Build Status](https://secure.travis-ci.org/orbitjs/orbit-core.png?branch=master)](http://travis-ci.org/orbitjs/orbit-core) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Orbit is a library for coordinating access to data sources and keeping their
contents synchronized.

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

## Dependencies

Orbit.js is dependent upon [Immutable.js](https://github.com/facebook/immutable-js/)
for immutable data structures, and [RxJS](https://github.com/Reactive-Extensions/RxJS)
for observables.

Orbit.js must be used in an environment that includes an implementation of the
[Promises/A+](http://promises-aplus.github.io/promises-spec/). If you wish to
support legacy browsers, you will need to include a library such as
[RSVP](https://github.com/tildeio/rsvp.js).

## Configuration

You'll need to configure Orbit to recognize any applicable dependencies.

Orbit defaults to using the global `Promise` constructor, if it exists. If your environment
does not implement Promises, or if you wish to use another Promise implementation, configure
your promise library's `Promise` constructor as follows:

```javascript
import Orbit from 'orbit';

Orbit.Promise = RSVP.Promise;
```

The `JSONAPISource` uses the experimental [Fetch
API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for network
requests. If you're running Orbit in an environment that does not support
`fetch`, use a polyfill such as [whatwg-fetch](https://github.com/github/fetch)
or [node-fetch](https://github.com/bitinn/node-fetch). Alternatively, you can
use a `fetch` ponyfill and set it on the main `Orbit` object. For example:

```javascript
import Orbit from 'orbit';
import fetch from 'ember-network/fetch';

Orbit.fetch = fetch;
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

Generate docs in the `/docs` directory:

```
npm run docs
```

## License

Copyright 2016 Cerebris Corporation. MIT License (see LICENSE for details).
