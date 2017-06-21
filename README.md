# Orbit [![Build Status](https://secure.travis-ci.org/orbitjs/orbit.png?branch=master)](http://travis-ci.org/orbitjs/orbit) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Orbit is a composable framework for orchestrating change processing, tracking,
and synchronization across multiple data sources.

Orbit is written in [Typescript](https://www.typescriptlang.org) and distributed
on npm through the [@orbit](https://www.npmjs.com/org/orbit) organization.
Pre-built distributions are provided in several module formats and ES language
levels.

Orbit is isomorphic - it can be run both in modern browsers as well as in the
[Node.js](https://nodejs.org/) runtime.

## Goals

Orbit was primarily designed as a data layer to support the needs of ambitious
client-side web applications, including:

* Optimistic and pessimistic UX patterns.

* Pluggable sources that share common interfaces, to allow similar behavior on
  different devices.

* Connection durability by queueing and retrying requests.

* Application durability by persisting all transient state.

* Warm caches of data available immediately on startup.

* Client-first / serverless development.

* Custom request coordination across multiple sources, allowing for priority
  and fallback plans.

* Branching and merging of immutable data caches.

* Deterministic change tracking.

* Undo / redo editing support.

In order to meet these goals, many primitives were developed in Orbit that can
be used in ways that go beyond these original use cases.

## Packages

### Core libraries

Orbit consists of the following core libraries:

* [@orbit/core](./packages/@orbit/core) - A core set of primitives for
performing, tracking, and responding to asynchronous tasks, including:

  * An event system that allows listeners to engage with the fulfillment of
    events by returning promises.

  * An asynchronous task processing queue.

  * A log that tracks a history of changes and allows for revision and
    interrogation.

  * A bucket interface for persisting state. Used by logs and queues.

* [@orbit/data](./packages/@orbit/data) - Applies the core Orbit primitives
to data sources. Includes the following elements:

  * A schema for defining models, including attributes and relationships.

  * Operations used to manipulate records (e.g. `addRecord`, `removeRecord`,
    `addToHasMany`, etc.).

  * Transforms, which are composed of any number of operations, and must be
    performed transactionally.

  * A query language that allows query expressions to be composed in a flexible
    AST form.

  * A base `Source` class that can be used to abstract any source of data.
    Sources can be decorated as `pullable`, `pushable`, `queryable`, `syncable`,
    and/or `updatable` - each decorator provides a unique interface that allows
    for transforms and queries to be applied as appropriate.

* [@orbit/coordinator](./packages/@orbit/coordinator) - A coordinator and set of
coordination strategies for managing data flow and keeping @orbit/data sources
in sync.

* [@orbit/utils](./packages/@orbit/utils) - A common set of utility functions
used by Orbit libraries.

### Standard data sources

Orbit provides the following sources for accessing and persisting data:

* [@orbit/store](./packages/@orbit/store) - An in-memory data store that
  supports complex querying and updating. Because stores maintain data in
  immutable data structures, they can be efficiently forked. Forked stores can
  diverge from the master store, and then the changes can be merged later.

* [@orbit/jsonapi](./packages/@orbit/jsonapi) - Provides full CRUD support,
  including complex querying, for a RESTful API that conforms to the
  [JSON:API](http://jsonapi.org/) specification.

* [@orbit/local-storage](./packages/@orbit/local-storage) -
  Persists records to local storage.

* [@orbit/indexeddb-bucket](./packages/@orbit/indexeddb-bucket) -
  Persists records to IndexedDB.

These standard sources can provide guidance for building your own custom sources
as well.

### Standard persistence buckets

Buckets are used to persist application state, such as queued requests and
change logs. Standard buckets include:

* [@orbit/local-storage-bucket](./packages/@orbit/local-storage-bucket) -
  Persists state to local storage.

* [@orbit/indexeddb-bucket](./packages/@orbit/indexeddb-bucket) -
  Persists state to IndexedDB.

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
