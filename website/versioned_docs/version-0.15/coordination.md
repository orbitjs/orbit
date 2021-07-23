---
title: Coordination strategies
---

Orbit provides another layer of abstraction on top of direct event observation
and handling: a `Coordinator`. A coordinator manages a set of sources to which
it applies a set of coordination strategies.

## Why use a coordinator?

Since configuring event handlers is so straightforward, what's the point of
using a coordinator? There are several benefits:

* You can easily add preconfigured strategies, such as an event logging
  strategy and a log truncation strategy (to keep the size of in-memory logs
  to a minimum). You can also create your own strategies and share them across
  applications.

* Strategies can be activated _and deactivated_ all together by simply calling
  `coordinator.activate()` / `coordinator.deactivate()`. Deactivating
  event handlers directly requires careful tracking of handler functions, which
  can be tedious. However, it's important to do this to avoid leaking memory.

* Coordinators can share a log-level across all strategies. Sometimes you want
  to see debug info and sometimes only errors.

## Creating a coordinator

A coordinator is typically shared across an application and manages all of the
coordination strategies between sources.

A coordinator can be created with sources and strategies:

```javascript
import Coordinator from '@orbit/coordinator';

const coordinator = new Coordinator({
  sources: [store, backup],
  strategies: [backupStoreSync]
});
```

Or sources and strategies can be added / removed any time the coordinator is
inactive:

```javascript
import Coordinator from '@orbit/coordinator';

const coordinator = new Coordinator();

coordinator.addSource(store);
coordinator.addSource(backup);
coordinator.addStrategy(backupStoreSync);
```

## Activating a coordinator

A coordinator won't actually do anything until it's been "activated", which is
an async process that activates all of the coordinator's strategies:

```javascript
coordinator.activate()
  .then(() => {
    console.log('Coordinator is active');
  });
```

Note that you can assign a log-level when activating a coordinator, and it
will be applied to all of the coordinator's strategies:

```javascript
import { LogLevel } from '@orbit/coordinator';

coordinator.activate({ logLevel: LogLevel.Info })
  .then(() => {
    console.log('Coordinator will be chatty');
  });
```

Possible log levels include `None`, `Errors`, `Warnings`, and `Info`.

## Deactivating a coordinator

If you want to temporarily disable a coordinator or change its settings, you
can deactivate it:

```javascript
coordinator.deactivate()
  .then(() => {
    console.log('Coordinator is inactive');
  });
```

At this point you can add/remove strategies and/or sources.

## Coordination strategies

Every `Strategy` has certain properties, including a name, the names of sources
to which it applies, a log level, and a log prefix.

`@orbit/coordinator` ships with several standard strategies, which are
discussed below. It's also straightforward to create your own custom
strategies.

### Request strategies

Request strategies participate in the [request flow](./data-flows.md). Every
request strategy should be defined with:

* `source` - the name of the observed source
* `on` - the name of the event to observe
* `target` - the name of the target source
* `action` - the name of the action on `target` that should be invoked
* `blocking` - a boolean indicating whether to block the completion of the
  observed event until the action on the target has been processed

Here are some example strategies that query / update a remote server
pessimistically whenever a store is queried / updated:

```javascript
import { RequestStrategy } from '@orbit/coordinator';

// Query the remote server whenever the store is queried
coordinator.addStrategy(new RequestStrategy({
  source: 'store',
  on: 'beforeQuery',

  target: 'remote',
  action: 'pull',

  blocking: true
}));

// Update the remote server whenever the store is updated
coordinator.addStrategy(new RequestStrategy({
  source: 'store',
  on: 'beforeUpdate',

  target: 'remote',
  action: 'push',

  blocking: true
}));
```

It's possible to apply a filter function to a strategy so that it only applies
to certain data. For instance, the following filter limits which queries should
be handled by a remote server:

```javascript
import { RequestStrategy } from '@orbit/coordinator';

// Only forward requests for planets on to the remote server
coordinator.addStrategy(new RequestStrategy({
  source: 'store',
  on: 'beforeQuery',

  target: 'remote',
  action: 'pull',

  blocking: true,

  filter(query) {
    return query.expression.op === 'findRecords' &&
           query.expression.type === 'planet'
  }
}));
```

### Sync strategies

Sync strategies participate in the [sync flow](./data-flows.md). Every
sync strategy should be defined with:

* `source` - the name of the observed source
* `target` - the name of the target source
* `blocking` - a boolean indicating whether to block the completion of the
  observed event until the action on the target has been processed

Sync strategies only observe the `transform` event and apply the `sync` method
on the `target`.

The following strategy synchronizes any changes to the `remote` source with a
`store`:

```javascript
import { SyncStrategy } from '@orbit/coordinator';

// Sync all changes received from the remote server to the store
coordinator.addStrategy(new SyncStrategy({
  source: 'remote',
  target: 'store',
  blocking: true
}));
```

As described above for request strategies, sync strategies can also accept a
`filter` function to limit the applicability of a strategy. This can be useful
to, say, only backup certain types of data to browser storage.

### Event logging strategies

An event logging strategy can be applied to log events on all sources to the
console. By default, all events will be logged on all sources registered to a
coordinator:

```javascript
import { EventLoggingStrategy } from '@orbit/coordinator';

coordinator.addStrategy(new EventLoggingStrategy());
```

You may wish to only observe events on certain interfaces, which can be
specified as follows:

```javascript
coordinator.addStrategy(new EventLoggingStrategy({
  interfaces: ['updatable', 'pushable', 'syncable']
}));
```

Valid interfaces include `updatable`, `queryable`, `pushable`, `pullable`, and
`syncable` (note the lower case).

Furthermore, you may wish to only observe certain sources, which can be
specified by name:

```javascript
coordinator.addStrategy(new EventLoggingStrategy({
  sources: ['remote', 'store']
}));
```

The event logging strategy will respect the log level that is specified when
the coordinator is activated.

### Log truncation strategies

Sources have another kind of log as well: a transform log, which tracks
transforms that are applied. As changes are applied to sources, their transform
logs grow in size. A log truncation strategy will keep the size of transform
logs in check. It observes the sources associated with the strategy and
truncates their transform logs when a common transform has been applied to them
all.

To add a log truncation strategy that applies to all sources:

```javascript
import { LogTruncationStrategy } from '@orbit/coordinator';

coordinator.addStrategy(new LogTruncationStrategy());
```

To limit the strategy to apply to only specific sources:

```javascript
coordinator.addStrategy(new LogTruncationStrategy({
  sources: ['backup', 'store']
}));
```
