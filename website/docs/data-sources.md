---
title: Data sources
---

Sources provide access to data. They vary widely in their capabilities: some
support interfaces for updating and/or querying records, while others simply
broadcast changes.

Orbit includes a number of "standard" record-specific sources:

- [@orbit/memory](./api/memory/index.md) - an in-memory source
- [@orbit/jsonapi](./api/jsonapi/index.md) - a JSON:API client
- [@orbit/indexeddb](./api/indexeddb/index.md) - for accessing IndexedDB
- [@orbit/local-storage](./api/local-storage/index.md) - for accessing LocalStorage

Custom sources can also be written to access to virtually any source of data.

## Base class

Every source derives from an abstract base class,
[`Source`](./api/data/classes/Source.md), which has a core set of capabilities.

Sources must be instantiated with a schema. A schema provides sources with an
understanding of the domain-specific data they manage.

Let's create a simple schema and memory source:

```typescript
import { RecordSchema } from '@orbit/records';
import { MemorySource } from '@orbit/memory';

// Create a schema
const schema = new RecordSchema({
  models: {
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      }
    }
  }
});

// Create a memory source that uses the schema
const memory = new MemorySource({ schema });
```

All sources can be mutated, although not all sources support _requests_ to
mutate. Some sources may only reflect mutations that come from elsewhere, such
as a source that wraps server-sent events.

Because all mutations in Orbit are trackable, sources maintain a log of changes,
or "transforms". This log represents an ordered history of transforms that have
been applied to a source. The size of this log can be kept in check by
truncating it after related sources have been synchronized.

Sources are also all "evented", meaning that they can emit events which
listeners can subscribe to. All sources support an event, `transform`, that is
emitted when that source changes. Most sources emit additional events as well
(the specifics depend upon their capabilities).

Let's look at an example of a simple mutation triggered by a call to `update`:

```typescript
// Define a record
const jupiter = {
  type: 'planet',
  id: 'jupiter',
  attributes: {
    name: 'Jupiter',
    classification: 'gas giant'
  }
};

// Observe and log all transforms
memory.on('transform', (t) => {
  console.log('transform', t);
});

// Check the size of the transform log before updates
console.log(`transforms: ${memory.transformLog.length}`);

// Update the memory source with a transform that adds a record
await memory.update((t) => t.addRecord(jupiter));

// Verify that the transform log has grown
console.log(`transforms: ${memory.transformLog.length}`);
```

The following should be logged as a result:

```typescript
'transforms: 0',
  'transform',
  {
    operations: [
      {
        op: 'addRecord',
        record: {
          type: 'planet',
          id: 'jupiter',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        }
      }
    ],
    options: undefined,
    id: '05e5d20e-02c9-42c4-a083-99662c647fd1'
  },
  'transforms: 1';
```

:::info
Want to learn more about updating data? [See the guide](./updating-data.md)
:::

## Standard interfaces

Orbit includes a number of standard interfaces that may be implemented by
sources:

- [`Updatable`](./api/data/interfaces/Updatable.md) - Allows sources to be
  updated via an `update` method that takes a transform and returns the updated
  records that result.

- [`Queryable`](./api/data/interfaces/Queryable.md) - Allows sources to be
  queried via a `query` method that receives a query expression and returns a
  recordset as a result.

- [`Syncable`](./api/data/interfaces/Syncable.md) - Applies a transform or
  transforms to a source via a `sync` method.

:::caution
The `Pullable` and `Pushable` interfaces have been deprecated in
v0.17 and are scheduled to be removed in v0.18.
:::

### Events

All of the interfaces above emit events that share a common pattern. For an
interface with a given method `x`, the following events will be emitted:
`beforeX`, `x`, and `xFail`. For example, updatable sources have an `update`
method and can emit `beforeUpdate`, `update`, and `updateFail` events.

In addition, any mutations caused by calling `x` will also be emitted with the
general `transform` event.

Processing occurs as follows (feel free to substitute `update`, `query`, etc.
for `x`):

1. `x` is called on a source.

2. The `beforeX` event is emitted by the source. Any promises that are returned
   from listeners will be settled serially. Any errors encountered will prevent
   further processing and cause the source to emit the `xFail` event.

3. `x` is processed internally by the source. Any errors encountered will
   prevent further processing and cause the source to emit the `xFail` event.

4. The `transform` event is emitted if `x` resulted in any mutations. Any
   promises that are returned from listeners will be settled serially. Errors
   will NOT prevent further processing.

5. The `x` event is emitted. Any promises that are returned
   from listeners will be settled serially. Errors will NOT prevent further
   processing.

There's a clear turning point after `x` has been processed internally by the
source. While listeners can block processing of `x` in the `beforeX` event by
returning a promise that fails, after `x` has been processed such failures will
be ignored by the emitter.

### Data flows

The [`Updatable`](./api/data/interfaces/Updatable.md) and
[`Queryable`](./api/data/interfaces/Queryable.md) interfaces participate in the
"request flow", in which requests are made upstream and data flows back down.

The [`Syncable`](./api/data/interfaces/Syncable.md) interface participates in
the "sync flow", in which data flowing downstream is synchronized with other
sources.

:::info
Want to learn more about data flows? [See the guide](./data-flows.md)
:::

### Developer-facing interfaces

Generally speaking, developers will primarily interact the
[`Updatable`](./api/data/interfaces/Updatable.md) and
[`Queryable`](./api/data/interfaces/Queryable.md) interfaces. The
[`Syncable`](./api/data/interfaces/Syncable.md) interface is used primarily via
coordination strategies.

:::info
See more specific guides that cover:
* [Updating data](./updating-data.md)
* [Querying data](./querying-data.md)
* [Coordination strategies](./coordination.md)
:::
