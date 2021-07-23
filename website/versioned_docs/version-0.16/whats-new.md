---
title: What's new in v0.16
---

This is a distillation of what's new in Orbit v0.16, intended as a reference for developers who need to upgrade their apps and libraries from v0.15.

## Changelog and release notes

The v0.16 beta cycle represents the first releases with a formal [changelog](https://github.com/orbitjs/orbit/blob/master/CHANGELOG.md) and [release notes](https://github.com/orbitjs/orbit/releases). We're committed to continuing this process going forward.

## New (and renamed) packages

New packages have been introduced since v0.15:

- `@orbit/memory` - The `@orbit/store` package has been deprecated in favor of a new `@orbit/memory` package (which contains all the same functionality). This clears the way for future Orbit packages that contain higher level Model and Store primitives.

- `@orbit/record-cache` - Extracts the `Cache` class from `@orbit/memory` as well as its associated processors to provide an abstract base for creating sources that access and maintain a complete set of records. Sync and async versions of caching logic are supported. This package is now used not only by `@orbit/memory`, but also by `@orbit/indexeddb` and `@orbit/local-storage`.

- `@orbit/serializers` - A set of interfaces and serializer classes that can be used by sources to serialize / deserialize primitive data types. Serializers are now used within the JSONAPISerializer to handle types such as `boolean`, `string`, `date`, `datetime`, and `number`. Serializers for custom types can also be registered (see https://github.com/orbitjs/orbit/pull/591 for a complete description).

- `@orbit/identity-map` - A new identity map for managing model instances. Intended for building Model and Store primitives.

## Build targets

Orbit continues to ship with a matrix of distributions that combine different
module types (ESM, CJS, and even AMD) with language levels (ES5 and ES2017).

Because the codebase now extensively uses `async` / `await` as well as
`for ... of`, the ES5 builds now must be paired with the `regenerator-runtime`
package to ensure that the `regeneratorRuntime` global is defined.

The default builds targeted by each package's `main` and `module` are now
ES-latest. These builds are as small and performant as possible, and of course
can be further processed with Babel if necessary.

_Important: There were still some build issues in v0.16.0, which have been resolved in v0.16.1. Please upgrade!_

## Request hints

Orbit v0.16 introduces the concept of "hints", which allow request listeners to
influence the results that a source returns from that request.

The main reason to use hints is to allow sources to take into account outside
information when processing a request. For instance, let's say that a user
queries a memory source and wants records returned in the same order they're
returned from the server. If the server is using a complex sorting algorithm, it
may be impossible to recreate that same logic (and full dataset) on the client
in the `MemorySource`.

Read more about using hints in the guide to [coordination
strategies](./coordination.md#using-hints).

## Memory sources can now be "rebased"

A new `rebase` method has been added to `@orbit/memory`. The `rebase` method works similarly to a git rebase. After a memory source has been forked, there will be two sources: a base and a fork. Both may be updated with transforms. When `fork.rebase()` is called, any commits on the fork will be undone, the commits to the base store since the fork point will be replayed on the fork, and then the commits on the fork will be replayed on top.

## Polymorphic relationship support

Relationships in your schemas can now specify multiple possible models as an array in the `model` field. For example:

```typescript
    {
      models: {
        star: {
          relationships: {
            celestialObjects: { type: 'hasMany', model: ['planet', 'moon'], inverse: 'star' }
          }
        },
     }
  }
```

In this way, a star can have both planets and moons as `celestialObjects`. Orbit is now one step closer to full JSON:API compliance! ⭐️

## JSON:API source customizations

The `@orbit/jsonapi` source now does its request processing in a new customizable `JSONAPIRequestProcessor` and `JSONAPIURLBuilder` classes.

## Preliminary: Support JSON:API operations

This release introduces preliminary and partial support for [JSON:API Operations](https://github.com/json-api/json-api/pull/1254) in `@orbit/jsonapi`, which are expected to be introduced to the JSON:API spec soon. Serialization and deserialization support for operations has been added to the `JSONAPISerializer` class. Further support will be added to the `JSONAPISource` for processing requests that include operations.

## Breaking: New expectations for sources!

While testing the hinting feature and its interactions with different source interfaces, Paul Chavard (@tchak) uncovered some scenarios in which hints could fail to return expected results (see [#612](https://github.com/orbitjs/orbit/pull/612)). This led to a quest to understand those problems and fix them across source interfaces. Unfortunately, in order to guarantee predictable and consistent behavior, we needed to move some responsibilities to source implementations that were previously handled in Orbit's private implementations of those interfaces.

Thus, if you're writing sources, please ensure that you do the following in any of your internal implementation methods that work with transforms (e.g. `_update`, `_sync`, etc.):

- Check the `transformLog` for the requested transform to see if work actually needs to be done before doing it.

- Invoke `transformed` for any transforms that are applied.

By moving these responsibilities to source implementations, we allow more flexibility in implementations. For instance, `_update` can ignore re-applying transforms that may have been sync'd via `beforeUpdate` listeners, while still returning results that are specified via the `hints` argument.

In order to update the `@orbit/memory` source to both support hints and respond to the above requirements, the following changes were needed:

```diff
  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _sync(transform: Transform): Promise<void> {
-    this._applyTransform(transform);
+    if (!this.transformLog.contains(transform.id)) {
+      this._applyTransform(transform); // <- internal implementation that applies the transform to the source's cache
+      await this.transformed([transform]);
+    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(transform: Transform, hints?: any): Promise<any> {
-    return this._applyTransform(transform);
+    let results: PatchResultData[];
+
+    if (!this.transformLog.contains(transform.id)) {
+      results = this._applyTransform(transform); // <- internal implementation that applies the transform to the source's cache
+      await this.transformed([transform]);
+    }
+
+    if (hints && hints.data) {
+      if (transform.operations.length > 1 && Array.isArray(hints.data)) {
+        return hints.data.map((idOrIds: RecordIdentity | RecordIdentity[]) =>
+          this._retrieveFromCache(idOrIds)
+        );
+      } else {
+        return this._retrieveFromCache(hints.data);
+      }
+    } else if (results) {
+      if (transform.operations.length === 1 && Array.isArray(results)) {
+        return results[0];
+      } else {
+        return results;
+      }
+    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(query: Query, hints?: any): Promise<any> {
-    return this._cache.query(query);
+    if (hints && hints.data) {
+      return this._retrieveFromCache(hints.data);
+    } else {
+      return this._cache.query(query);
+    }
  }
```

Please review your custom sources to make any necessary changes. If your methods don't support hints, the diffs should rather small, like in the `_sync` method above. If you want to support `hints`, you'll need to provide alternate code paths for when hints are provided and not, like in the `_update` and `_query` methods above.

We're planning to include a guide to writing your own sources with the v0.16 release to clarify all these responsibilities.

## Other changes

- [#667](https://github.com/orbitjs/orbit/pull/667) The `@orbit/jsonapi` source now supports the `Updatable` interface, which can be more user-friendly to directly interact with than the `Pullable` interface.

- [#669](https://github.com/orbitjs/orbit/pull/669) `filter` | `sort` | `page` support has been added to `findRelatedRecords` queries and all the standard implementations.

- [#671](https://github.com/orbitjs/orbit/pull/671) Explicit source `activate` and `deactivate` methods have been added to provide hooks to ensure that sources have performed any setup and teardown steps prior to processing. These hooks are automatically called as part of coordinator activation / deactivation, and sources themselves will auto-activate by default (note that this is an async process that can be watched via the new `activated` property).

- [#673](https://github.com/orbitjs/orbit/pull/673) Whenever tasks are cancelled and removed from a queue (such as a source's `requestQueue` or `syncQueue`), the promise associated with that task will now always be rejected (if it hasn't already settled). You can control the rejection error or use the default error.

## Other deprecations / breaking changes

- [#574](https://github.com/orbitjs/orbit/pull/574) Deprecate `replaceRecord` op in favor of `updateRecord`.

- [#573](https://github.com/orbitjs/orbit/pull/573) Expose `assert` + `deprecate` only on OrbitGlobal.

- [#567](https://github.com/orbitjs/orbit/pull/567) Define `Listener` interface and remove support for explicit binding object in listeners.

## Committers

Many thanks to the committers who made v0.16 possible:

- Alexey ([@Raiondesu](https://github.com/Raiondesu))
- Andrey Mikhaylov ([@lolmaus](https://github.com/lolmaus))
- Bernhard Halbartschlager ([@Bernhard---H](https://github.com/Bernhard---H))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Gerald Gayowsky ([@ggayowsky](https://github.com/ggayowsky))
- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Miguel Camba ([@cibernox](https://github.com/cibernox))
- Paul Chavard ([@tchak](https://github.com/tchak))
- Paweł Bator ([@jembezmamy](https://github.com/jembezmamy))
- Pieter-Jan Vandenbussche ([@PieterJanVdb](https://github.com/PieterJanVdb))
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))
