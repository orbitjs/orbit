---
title: Data stores
---

Data stores, which come from the `@orbit/store` package, have been discussed at
length throughout this guide already. Stores implement the `Updatable`,
`Queryable`, and `Syncable` interfaces, and are the primary interface through
which developers will interact with an Orbit application.

Instead of re-explaining [querying](./querying-data.md) and
[updating](./updating-data.md) stores, this section explores some unique
capabilities of stores and their inner workings.

## Cache

Every store keeps its data in memory in a `Cache`, which is accessible via the
`store.cache` member.

### Immutable data

Caches use immutable data maps from `@orbit/immutable` to store their actual
data. This makes it incredibly efficient to clone caches, and thus stores,
which has benefits we'll discuss shortly.

The use of immutable data structures does not extend into the records
themselves, which are stored as simple POJOs. Therefore, it's not necessary to
use immutable access methods when working with records. There is some
performance tradeoff involved here, because individual records must be cloned
on mutation.

### Operation processors

Every change to a cache is observed by several "operation processors", whose job
it is to ensure that the cache maintains its integrity and continues to conform
to its associated schema.

A single transform applied to a store may result in many changes being made by
operation processors. For instance, when a record is removed, it must be
removed from all of its associated relationships. When a relationship with an
inverse is removed, that inverse relationship must also be removed.

### Patches

Typically you should not be applying changes directly to a cache. It's far
preferable to apply changes to the associated store through its `update` event.

However, caches can be modified via a `patch` method, that takes an `Operation`
or array of `Operation`s.

The `PatchResult` that's returned has the following signature:

```typescript
type PatchResultData = Record | RecordIdentity | null;

interface PatchResult {
  inverse: RecordOperation[],
  data: PatchResultData[]
}
```

All changes to a cache will be emitted as `patch` events. These events include
the `Operation` that was applied as well as any data returned.

Its important to recognize that `patch` events will be emitted for _EVERY_
change, including those made by operation processors. Therefore, if you need
a high fidelity log of changes to a store, observe its cache's `patch` events.

### Querying cache data

As has been [discussed](./querying-data.md), the contents of a cache can be
queried directly and synchronously, using the same query expressions that can be
applied to other sources.

While `store.query` is asynchronous and thus returns results wrapped in a
promise, `store.cache.query` is synchronous and returns results directly. For
example:

```javascript
// Results will be returned synchronously by querying the cache
let planets = store.cache.query(q => q.findRecords('planet').sort('name'));
```

> By querying the cache instead of the store, you're not allowing other
sources to participate in the fulfillment of the query. If you want to
coordinate queries across multiple sources, it's critical to make requests
directly on the store.

## Forking stores

Because caches store their data in immutable structures, cloning them is
incredibly "cheap". It's possible to "fork" a store quickly, modify its data in
isolation from its parent, and optionally "merge" those changes back.

Let's look at an example of store forking and merging:

```typescript
// start by adding two planets and a moon to the store
await store.update(t => [
  t.addRecord(earth),
  t.addRecord(venus),
  t.addRecord(theMoon)
]);

let planets = await store.query(q => q.findRecords("planet").sort("name"));
console.log("original planets", planets);

// fork the store
let forkedStore = store.fork();

// add a planet and moons to the fork
await forkedStore.update(t => [
  t.addRecord(jupiter),
  t.addRecord(io),
  t.addRecord(europa)
]);

// query the planets in the forked store
planets = await forkedStore.query(q => q.findRecords("planet").sort("name"));
console.log("planets in fork", planets);

// merge the forked store back into the original store
await store.merge(forkedStore);

// query the planets in the original store
planets = await store.query(q => q.findRecords("planet").sort("name"));
console.log("merged planets", planets);
```

It's important to note a few things about store forking and merging:

* Once a store has been forked, the original and forked stores' data can
  diverge independently.

* A store fork can simply be abandoned without cost.

* Merging a fork will gather the transforms applied since the fork point,
  coalesce the operations in those transforms into a single new transform,
  and then update the original store.

<hr />

Want to experiment with store forking and merging?

See [this example in CodeSandbox](https://codesandbox.io/s/40lo886nn7?previewwindow=console).
