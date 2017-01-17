# Orbit.js [![Build Status](https://secure.travis-ci.org/orbitjs/orbit-core.png?branch=master)](http://travis-ci.org/orbitjs/orbit-core) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Orbit is a library for coordinating access to data sources and keeping their
contents synchronized.

Orbit provides a foundation for building advanced features in client-side
applications such as offline operation, maintenance and synchronization of local
caches, undo / redo stacks and ad hoc editing contexts.

## Goals

* Support any number of different data sources in an application and
  provide access to them through common interfaces.

* Allow for the fulfillment of requests by different sources, including
  the ability to specify priority and fallback plans.

* Allow records to simultaneously exist in different states across sources.

* Coordinate transformations across sources. Handle merges automatically
  where possible but allow for complete custom control.

* Allow for blocking and non-blocking coordination.

* Allow for synchronous and asynchronous requests.

* Support transactions and rollbacks by tracking operation inverses.

## Installation

Install with npm:

```
npm install orbit-core
```

The original source code is maintained in ES2015 modules in `/src`.

AMD and CJS builds are in `/dist`.

## Dependencies

Orbit.js must be used in an environment that includes an implementation of the
[Promises/A+](http://promises-aplus.github.io/promises-spec/). If you wish to
support legacy browsers, you will need to include a library such as
[RSVP](https://github.com/tildeio/rsvp.js).

## Configuration

Orbit defaults to using the global `Promise` constructor, if it exists. If your
environment does not implement Promises, or if you wish to use another Promise
implementation, configure your promise library's `Promise` constructor as
follows:

```javascript
import Orbit from 'orbit';
import RSVP from 'rsvp';

Orbit.Promise = RSVP.Promise;
```

## Contributing

### Installation

Install the CLI for [Broccoli](https://github.com/broccolijs/broccoli) globally:

```
npm install -g broccoli-cli
```

Install other dependencies:

```
npm install
```

### Building

Distributions can be built to the `/dist` directory by running:

```
npm run build
```

### Testing

#### CI Testing

Test in CI mode by running:

```
npm test
```

Or directly with testem (useful for configuring options):

```
testem ci
```

#### Browser Testing

Test within a browser
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
