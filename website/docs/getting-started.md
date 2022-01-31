---
title: Getting started
---

This brief tutorial walks through using Orbit to manage
[record-specific](/intro.md#record-specific-primitives) data in a client-side
application. Sticking with the "orbit" theme, this application will track some
objects orbiting in our own solar system.

## Defining a schema

Schemas are used to define the models and relationships for an application.

Let's start by defining a schema for our solar system's data:

```typescript
import { RecordSchema } from '@orbit/records';

const schema = new RecordSchema({
  models: {
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' },
        atmosphere: { type: 'boolean' }
      },
      relationships: {
        moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' }
      }
    },
    moon: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
      }
    }
  }
});
```

This schema defines two models, `planet` and `moon`, as well as the attributes
and relationships that are possible for each. A moon can have one planet, while
a planet can have many moons. By setting an `inverse` for each relationship,
we're telling Orbit that changes to one side of the relationship should be
reflected in the other.

## Defining a source

Sources provide interfaces to access data. To ensure that they have the same
understanding of data, every source in an application should share the same
schema.

Let's create an in-memory source as our first data source:

```typescript
import { MemorySource } from '@orbit/memory';

const memory = new MemorySource({ schema });
```

## Loading and querying data

We can now load some data into our memory source and then query its contents:

```typescript
const earth = {
  type: 'planet',
  id: 'earth',
  attributes: {
    name: 'Earth',
    classification: 'terrestrial',
    atmosphere: true
  }
};

const venus = {
  type: 'planet',
  id: 'venus',
  attributes: {
    name: 'Venus',
    classification: 'terrestrial',
    atmosphere: true
  }
};

const theMoon = {
  type: 'moon',
  id: 'theMoon',
  attributes: {
    name: 'The Moon'
  },
  relationships: {
    planet: { data: { type: 'planet', id: 'earth' } }
  }
};

await memory.update((t) => [
  t.addRecord(venus),
  t.addRecord(earth),
  t.addRecord(theMoon)
]);

let planets = await memory.query((q) => q.findRecords('planet').sort('name'));
console.log(planets);
```

The following output should be logged:

```typescript
[
  {
    type: 'planet',
    id: 'earth',
    attributes: {
      name: 'Earth',
      classification: 'terrestrial',
      atmosphere: true
    },
    relationships: {
      moons: {
        data: [{ type: 'moon', id: 'theMoon' }]
      }
    }
  },
  {
    type: 'planet',
    id: 'venus',
    attributes: {
      name: 'Venus',
      classification: 'terrestrial',
      atmosphere: true
    }
  }
];
```

There's a lot going on here, so let's break it down.

First of all, each record is represented by a POJO that aligns with its
corresponding model definition in the schema. These representations conform with
the [JSON:API](http://jsonapi.org/) specification. Every record has an identity
established by a `type` and `id` pair. Relationship linkage is specified in a
`data` object via identities.

In order to add records to the memory source, we call `memory.update()` and pass
an array of operations. Passing a function to `update` provides us with a
transform builder (`t`), which we use to create an array of `addRecord`
operations.

Note that we added the relationship between the moon and the planet on just the
moon record. However, when we query the planet, we can see that the inverse
relationship has also been added. This is because every operation that's applied
to the memory source's cache passes through a schema consistency check.

Let's look at how the memory source is queried:

```typescript
let planets = await memory.query((q) => q.findRecords('planet').sort('name'));
```

Because we pass a function to `query`, Orbit provides us with a query builder
(`q`) which we can use to compose a query expression. We're creating a simple
`findRecords` query that's sorted by `name`. Internally, query expressions are
represented in an [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) form
that allows for nearly limitless expressivity (the only limit being that all
sources involved in processing a query need to understand the expressions
involved).

Here's an example of a more complex query that filters, sorts, and paginates:

```typescript
let planets = await memory.query((q) =>
  q
    .findRecords('planet')
    .filter({ attribute: 'classification', value: 'terrestrial' })
    .sort({ attribute: 'name', order: 'descending' })
    .page({ offset: 0, limit: 10 })
);
```

### Asynchronous vs. synchronous queries

Note that `memory.query` is asynchronous and thus returns results wrapped in a
promise. This may seem strange at first because the memory source's data is "in memory".
In fact, if you want to just "peek" into the contents of the memory source,
you can issue the same queries synchronously against the memory source's `Cache`.
For example:

```typescript
// Results will be returned synchronously by querying the cache
let planets = memory.cache.query((q) => q.findRecords('planet').sort('name'));
```

By querying the cache instead of the memory source, you're not allowing other sources to
participate in the fulfillment of the query. Continue reading to understand how
requests to sources can be "coordinated".

:::tip Want to experiment?
See [Part 1 of this example in CodeSandbox](https://codesandbox.io/s/orbitjs-v017-getting-started-part-1-q4n3s?previewwindow=console).
:::

## Defining a backup source

Our in-memory data source is quite isolated at the moment. If a scientist is
using our application to track their discoveries, a browser refresh might lose a
whole planet or moon! 😱

Let's create a browser storage source to keep data around locally:

```typescript
import { IndexedDBSource } from '@orbit/indexeddb';

const backup = new IndexedDBSource({
  schema,
  name: 'backup',
  namespace: 'solarsystem'
});
```

## Sync'ing changes between sources

Every time a source is transformed, it emits a `transform` event. It's simple
to observe these events directly:

```typescript
memory.on('transform', (transform) => {
  console.log(transform);
});
```

It's possible to pipe changes that occur in one source into another via the
`sync` method:

```typescript
memory.on('transform', (transform) => {
  backup.sync(transform);
});
```

Like all mutation and query methods on sources, the `sync` call returns a
promise. If we want to guarantee that transforms can't be applied to our memory
source without also being backed up, we should return the promise in the event
handler:

```typescript
memory.on('transform', (transform) => {
  return backup.sync(transform);
});
```

Or more simply:

```typescript
memory.on('transform', (transform) => backup.sync(transform));
```

With this single line of code we've guaranteed that every change to the
in-memory source will be sync'd with the backup IndexedDB source. Furthermore,
we've configured this synchronization to be "blocking", so that changes to the
memory source can't be made at all unless they are also backed up.

## Introducing a coordinator

Orbit provides another layer of abstraction on top of direct event
observation and handling: a `Coordinator`. A coordinator manages a set of
sources to which it applies a set of coordination strategies.

A coordinator could be configured to handle the above scenario as follows:

```typescript
import { Coordinator, SyncStrategy } from '@orbit/coordinator';

const coordinator = new Coordinator({
  sources: [memory, backup]
});

const backupMemorySync = new SyncStrategy({
  source: 'memory',
  target: 'backup',
  blocking: true
});

coordinator.addStrategy(backupMemorySync);

// `activate` resolves when all strategies have been activated
await coordinator.activate();
```

Although this might seem like an unnecessary amount of complexity compared with
the simple event handler, there are a number of benefits to using a coordinator:

- You can easily add preconfigured strategies, such as an event logging
  strategy and a log truncation strategy (to keep the size of in-memory logs
  to a minimum). You can also create your own strategies and share them across
  applications.

- Strategies can be activated _and deactivated_ all together by simply calling
  `coordinator.activate()` / `coordinator.deactivate()`. Deactivating
  event handlers directly requires careful tracking of handler functions, which
  can be tedious. However, it's important to do this to avoid leaking memory.

- Coordinators can share a log-level across all strategies. Sometimes you want
  to see debug info and sometimes only errors.

## Restoring from backup

Although we're now backing up our memory source to browser storage, we have not
yet set up a process to restore that backed up data.

If we want our app to restore all of its data from browser storage when it
first boots, we could perform the following:

```typescript
let allRecords = await backup.query((q) => q.findRecords());
await memory.sync((t) => allRecords.map((r) => t.addRecord(r)));
await coordinator.activate();
```

This code first queries all the records from the backup source and then syncs
them with the main memory source _before_ activating the coordinator. In this
way, the coordination strategy that backs up the memory source won't be enabled
until after the restore is complete.

We now have an application which has data fully contained in the browser. Any
data that's entered can be accessed while offline and will even persist across
browser refreshes.

:::tip Want to experiment?
See [Part 2 of this example in CodeSandbox](https://codesandbox.io/s/orbitjs-v017-getting-started-part-2-vt4ct?previewwindow=console).
:::

## Communicating with a server

Most apps can't exist in the vacuum of a browser&mdash;data tends to be far
more useful when it's shared with a server.

Let's say that we have a web server that conforms with the
[JSON:API](http://jsonapi.org/) specification. We can use Orbit's
[`JSONAPISource`](./api/jsonapi/classes/JSONAPISource.md) to allow our app to
communicate with that server.

We'll start by creating a new `remote` source:

```typescript
import { JSONAPISource } from '@orbit/jsonapi';

const remote = new JSONAPISource({
  schema,
  name: 'remote',
  host: 'http://api.example.com'
});
```

Next let's add the source to the coordinator:

```typescript
coordinator.addSource(remote);
```

And then we can add strategies to ensure that queries and updates made against
the memory source are processed by the remote server:

```typescript
import { RequestStrategy, SyncStrategy } from '@orbit/coordinator';

// Query the remote server whenever the memory source is queried
coordinator.addStrategy(
  new RequestStrategy({
    source: 'memory',
    on: 'beforeQuery',

    target: 'remote',
    action: 'query',

    blocking: false
  })
);

// Update the remote server whenever the memory source is updated
coordinator.addStrategy(
  new RequestStrategy({
    source: 'memory',
    on: 'beforeUpdate',

    target: 'remote',
    action: 'update',

    blocking: false
  })
);

// Sync all changes received from the remote server to the memory source
coordinator.addStrategy(
  new SyncStrategy({
    source: 'remote',
    target: 'memory',
    blocking: false
  })
);
```

These strategies are all non-blocking, which means that the memory source will
be updated / queried optimistically without waiting for responses from the
server. Once the server responses are received, they will then be sync'd back
with the memory source.

This set of coordination strategies is certainly not yet production ready. We
will need exception handling in our strategies to tell Orbit how to handle
network errors (e.g. retry after X secs) as well as other types of exceptions.

Optimistic server requests paired with an in-browser backup can work well for
some kinds of applications. For other applications, it's more appropriate to use
blocking strategies that tie the success of memory source requests to a
successful round trip to the server. Still other applications might choose to
mix strategies, so that only certain updates are blocking (e.g. a store
purchase).

Orbit allows for filtering, exception handling, and more in strategies to
enable any of these options. We'll dive deeper into these topics in the rest of
this guide, the API docs, and sample applications.

## Managing state with buckets

At any given time, our Orbit application may have different kinds of state
in-flight and unpersisted. This state may include tasks that are queued for
processing, logs of transforms that have been applied, or other source-specific
state that we'd like to reify if our application was closed unexpectedly.

In order to persist this state, we can create a "bucket" that can be shared
among our sources:

```typescript
import { LocalStorageBucket } from '@orbit/local-storage-bucket';
import { IndexedDBBucket, supportsIndexedDB } from '@orbit/indexeddb-bucket';

const BucketClass = supportsIndexedDB() ? IndexedDBBucket : LocalStorageBucket;
const bucket = new BucketClass({ namespace: 'my-app' });
```

Note that the above code favors using an IndexedDB-based bucket and only falls
back to using a LocalStorage-based bucket if necessary.

This `bucket` can be passed as a setting to any and all of our sources.
For instance:

```typescript
const backup = new IndexedDBSource({
  bucket,
  schema,
  name: 'backup',
  namespace: 'solarsystem'
});

const memory = new MemorySource({ bucket, schema });
```

Each source will use the bucket to initialize its queues, logs, and other state.
And as their state changes, sources will use buckets to persist those changes.

Of course, buckets can also be used for ad-hoc state persistence of any kind
by other parts of your application. The possibilities are extensive!

<hr />

That concludes a brief run-through of some of the key aspects of Orbit. Please
continue reading the guides to gain a deeper understanding of how Orbit works
and how to make the most of it.
