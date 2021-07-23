---
id: "index"
title: "Orbit.js API Reference"
slug: "/api"
sidebar_label: "Summary"
sidebar_position: 0.5
custom_edit_url: null
---

Orbit is distributed on npm through the
[@orbit](https://www.npmjs.com/org/orbit) organization in several packages.
This API reference is organized according to these packages.

## Core libraries

Orbit consists of the following core libraries:

- [@orbit/core](./core/index.md) - A core
  set of primitives for performing, tracking, and responding to asynchronous
  tasks, including:

  - An event system that allows listeners to engage with the fulfillment of
    events by returning promises.

  - An asynchronous task processing queue.

  - A log that tracks a history of changes and allows for revision and
    interrogation.

  - A bucket interface for persisting state. Used by logs and queues.

- [@orbit/data](./data/index.md) - Applies the core Orbit primitives to data
  sources. Includes the following:

  - [`Source`](./data/classes/Source.md) - a base class that can be used to
    abstract any source of data. Sources can be decorated as
    [`@queryable`](./data/interfaces/Queryable.md),
    [`@updatable`](./data/interfaces/Updatable.md), and/or
    [`@syncable`](./data/interfaces/Syncable.md).

  - [`Transform`](./data/interfaces/Transform.md) - composed of any number of
    [`Operation`](./data/interfaces/Operation.md)s, a transform represents a set
    of mutations to be applied transactionally.

  - [`Query`](./data/interfaces/Query.md) - composed of one or more
    [`QueryExpression`](./data/interfaces/QueryExpression.md)s, a query
    represents a request for data.

- [@orbit/records](./records/index.md) - Extends the general data concepts from
  [@orbit/data](./data/index.md) to make record-specific classes and interfaces.
  These include:

  - `RecordSource` - a base class that extends `Source`.

  - `RecordSchema` - define models, including attributes and
    relationships.

  - Operations that are specific to records (e.g. `addRecord`, `removeRecord`,
    `addToHasMany`, etc.).

  - Query expressions that are specific to records (e.g. `findRecord`,
    `findRecords`, etc.).

  - Tranform and query builders that use chainable terms to create operations
    and expressions.

- [@orbit/record-cache](./record-cache/index.md) - Everything you need to build
   your own caches that hold data records (useful within record-specific
   sources).

- [@orbit/coordinator](./coordinator/index.md) -
  A coordinator and set of coordination strategies for managing data flow and
  keeping Orbit Data sources in sync.

- [@orbit/serializers](./serializers/index.md) - A base set of serializers for
  serializing / deserializing data types.

- [@orbit/validators](./validators/index.md) - A set of validators for
  validating primitive data and utilities for building higher order validators.

- [@orbit/identity-map](./identity-map/index.md) - A simple identity map to
  manage model instances.

- [@orbit/immutable](./immutable/index.md) - A lightweight library of immutable
  data structures.

- [@orbit/utils](./utils/index.md) - A common set of utility functions used by
  Orbit libs.

## Record-specific data sources

All of the following sources are based on [@orbit/records](./records/index.md).
They provide uniform interfaces to query and mutate record-specific data:

- [@orbit/memory](./memory/index.md) - An in-memory data source that supports
  complex querying and updating. Because memory sources maintain data in
  immutable data structures, they can be efficiently forked. Forked memory
  sources can diverge from the master memory source, and then the changes can be
  merged later.

- [@orbit/jsonapi](./jsonapi/index.md) - Provides full CRUD support, including
  complex querying, for a RESTful API that conforms to the
  [JSON:API](http://jsonapi.org/) specification.

- [@orbit/local-storage](./local-storage/index.md) - Persists records to local
  storage.

- [@orbit/indexeddb](./indexeddb/index.md) - Persists records to IndexedDB.

These standard sources can provide guidance for building your own custom sources
as well.

## Persistence buckets

Buckets are used to persist application state, such as queued requests and
change logs. Standard buckets include:

- [@orbit/local-storage-bucket](./local-storage-bucket/index.md) - Persists
  state to local storage.

- [@orbit/indexeddb-bucket](./indexeddb-bucket/index.md) - Persists state to
  IndexedDB.

## Additional libraries

Some additional libraries related to Orbit, but not covered by these docs,
include:

- [ember-orbit](https://github.com/orbitjs/ember-orbit) - An Ember.js data
  layer heavily inspired by Ember Data.
