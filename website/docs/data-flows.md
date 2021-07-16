---
title: Data flows
---

Orbit enables the coordination of many independent sources of data, each of
which may internally handle queries and updates differently. It's easy to
imagine tying oneself in knots with such potential complexity. However, by
following Orbit's conventions and a few guidelines, you can compose data to
flow predictably and reliably through your application.

## "Request up, sync down"

Orbit divides the movement of data into two different "flows":

- **Request flow** - Requests to query or update data originate from an
  application and flow upstream to a source that can fulfill the request.

- **Sync flow** - Mutations then flow back downstream and are synchronized
  with all the sources that are concerned.

Every source interface has events and methods that correspond with one of these
flows:

- The `Updatable`, `Queryable`, `Pushable`, and `Pullable` interfaces all
  participate in the request flow.

- The `Syncable` interface participates in the sync flow.

> "Request up, sync down" is a variant of the "data down, actions up" mnemonic
> popularized in the [Ember.js](https://emberjs.com/) community. In fact, most
> frontend frameworks adopt a similar pattern for handling actions and returning
> data. Orbit fits well with these patterns: an action triggered by a user can
> spawn an Orbit "request", which can lead to responses that "sync" data back
> down, typically ending in an update to a view. In this way, "request up, sync
> down" can be seen as a continuation of the "data down, actions up" pattern.

## Coordinating sources

Request and sync flows can be coordinated across sources by configuring an event
listener for one source that triggers actions on another.

Let's take a look at what events can trigger other actions:

- Update events (`beforeUpdate`, `update`, `beforePush`, `push`) can trigger
  `push`.

- Query events (`beforeQuery`, `query`, `beforePull`, `pull`) can trigger
  `pull`.

- Change events (`transform`, `beforeSync`, `sync`) can trigger `sync`.

### Blocking vs. non-blocking

We can coordinate sources through simple event listeners, such as:

```javascript
memory.on("beforeUpdate", transform => {
  remote.push(transform);
});
```

The above listener is "non-blocking" because it doesn't return anything to
the emitter. The call to `remote.push()` is async and may take a while to
complete, so it will proceed in parallel with the `memory` source being updated.

As an alternative, we can use a "blocking" strategy in our event listener by
simply returning a promise:

```javascript
memory.on("beforeUpdate", transform => remote.push(transform));
```

This will prevent the `memory` source from updating before the transform has been pushed
up to the `remote` source. An error in `remote.push` will cause `memory.update`
to error as well.

### Coordination guidelines

Here are some guidelines for working with data flows:

- Consider the full arc of each request—how it will flow up to be fulfilled,
  and how results and/or errors will be synchronized on the way back down.

- Avoid spawning requests from the synchronization flow. A change event
  (`beforeSync`, `sync`, or `transform`) should only ever trigger a `sync`
  action.

- For pessimistic requests in which you must guarantee success before
  proceeding, use blocking connections for all the request and
  sync flows that may be involved.

Last but not least, it's recommended that you use a `Coordinator` instead of
manually configuring event listeners. Read on to understand why ...
