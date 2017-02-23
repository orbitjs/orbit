# Orbit [![Build Status](https://secure.travis-ci.org/orbitjs/orbit.png?branch=master)](http://travis-ci.org/orbitjs/orbit) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

Install Orbit's core package with npm:

```
npm install @orbit/core
```

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
import Orbit from '@orbit/core';
import RSVP from 'rsvp';

Orbit.Promise = RSVP.Promise;
```

## Contributing

Orbit's main packages are maintained in this "mono-repo" and managed by
[lerna](https://lernajs.io).

### Installation

Install dependencies for the main repo and its packages:

```
npm install
```

### Building

Build distributions for all packages:

```
npm run build
```

### Testing

Test all packages:

```
npm test
```

Or `cd` into each package's dir and test it individually in the browser:

```
cd packages/@orbit/core
testem
```

## License

Copyright 2014-2017 Cerebris Corporation. MIT License (see LICENSE for details).
