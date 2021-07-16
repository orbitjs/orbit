---
title: Packages
---

Orbit is distributed on npm through the
[@orbit](https://www.npmjs.com/org/orbit) organization in several packages.

## Core libraries

Orbit consists of the following core libraries:

- [@orbit/core](https://www.npmjs.com/package/@orbit/core) - A core
  set of primitives for performing, tracking, and responding to asynchronous
  tasks, including:

  - An event system that allows listeners to engage with the fulfillment of
    events by returning promises.

  - An asynchronous task processing queue.

  - A log that tracks a history of changes and allows for revision and
    interrogation.

  - A bucket interface for persisting state. Used by logs and queues.

- [@orbit/data](https://www.npmjs.com/package/@orbit/data) - Applies
  the core Orbit primitives to data sources. Includes the following elements:

  - A schema for defining models, including attributes and relationships.

  - Operations used to manipulate records (e.g. `addRecord`, `removeRecord`,
    `addToHasMany`, etc.).

  - Transforms, which are composed of any number of operations, and must be
    performed transactionally.

  - A query language that allows query expressions to be composed in a flexible
    AST form.

  - A base `Source` class that can be used to abstract any source of data.
    Sources can be decorated as `pullable`, `pushable`, `queryable`, `syncable`,
    and/or `updatable` - each decorator provides a unique interface that allows
    for transforms and queries to be applied as appropriate.

- [@orbit/coordinator](https://www.npmjs.com/package/@orbit/coordinator) -
  A coordinator and set of coordination strategies for managing data flow and
  keeping Orbit Data sources in sync.

- [@orbit/utils](https://www.npmjs.com/package/@orbit/utils) - A
  common set of utility functions used by Orbit libs.

## Standard data sources

Orbit provides the following sources for accessing and persisting data:

- [@orbit/memory](https://www.npmjs.com/package/@orbit/memory) - An
  in-memory data source that supports complex querying and updating. Because
  memory sources maintain data in immutable data structures, they can be efficiently
  forked. Forked memory sources can diverge from the master memory source, and then the changes
  can be merged later.

- [@orbit/jsonapi](https://www.npmjs.com/package/@orbit/jsonapi) -
  Provides full CRUD support, including complex querying, for a RESTful API that
  conforms to the [JSON:API](http://jsonapi.org/) specification.

- [@orbit/local-storage](https://www.npmjs.com/package/@orbit/local-storage) -
  Persists records to local storage.

- [@orbit/indexeddb](https://www.npmjs.com/package/@orbit/indexeddb) -
  Persists records to IndexedDB.

These standard sources can provide guidance for building your own custom sources
as well.

## Standard persistence buckets

Buckets are used to persist application state, such as queued requests and
change logs. Standard buckets include:

- [@orbit/local-storage-bucket](https://www.npmjs.com/package/@orbit/local-storage-bucket) -
  Persists state to local storage.

- [@orbit/indexeddb-bucket](https://www.npmjs.com/package/@orbit/indexeddb-bucket) -
  Persists state to IndexedDB.

## Additional libraries

Additional libraries related to Orbit include:

- [ember-orbit](https://www.npmjs.com/package/ember-orbit) - An Ember.js data
  layer heavily inspired by Ember Data.
