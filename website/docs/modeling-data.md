---
title: Modeling data
---

Data records must have a normalized structure that's consistent
with Orbit's expectations as well as the constraints of a particular
application.

## Records

Records are represented as lightweight, serializable POJOs (i.e. "Plain old
JavaScript objects").

The structure used for records conforms to the [JSON:API](http://jsonapi.org/)
specification. Records can have fields that define their identity, attributes,
and relationships with other records.

Here's an example record that represents a planet:

```typescript
{
  type: 'planet',
  id: 'earth',
  attributes: {
    name: 'Earth',
    classification: 'terrestrial',
    atmosphere: true
  },
  relationships: {
    solarSystem: {
      data: { type: 'solarSystem', id: 'theSolarSystem' }
    },
    moons: {
      data: [
        { type: 'moon', id: 'theMoon' }
      ]
    }
  }
}
```

:::caution

Just like [JSON:API resource
fields](https://jsonapi.org/format/#document-resource-object-fields), all the
fields in an Orbit record share the same namespace and must be unique. A record
can not have an attribute and relationship with the same name, nor can it have
an attribute or relationship named `type` or `id`.
:::

### Identity

Each record's identity is established by a union of the following fields:

- `type` - a string that identifies a set of records with a shared definition
- `id` - a string that uniquely identifies a record of a given `type`

Both fields must be defined in order for a record to be identified uniquely.

Applications can take one of the following approaches to managing identity:

1. Auto-generate IDs, typically as v4 UUIDs, and then use the same IDs locally
   and remotely.

2. Remotely generate IDs and only reference records by those IDs.

3. Auto-generate IDs locally and map those IDs to canonical IDs (or "keys")
   generated remotely.

The first approach is the most straightforward, flexible, and requires the least
configuration. However, it is not feasible when working with servers that do not
accept client-generated IDs.

The second approach only works if you never need to generate _new_ records
with Orbit, only reference existing ones generated remotely.

The third approach is a pragmatic blend of local and remote generated IDs.
Although mapping IDs requires more configuration and complexity than having a
single ID for each record, this approach does not constrain the capabilities of
your application.

:::tip
It's possible to mix these approaches for different types of records
(i.e. models) within a given application.
:::

### Keys

When pairing locally-generated IDs, Orbit uses "keys" to support mapping between
local and remote IDs.

Remote IDs should be kept in a `keys` object at the root of a record.

For example, the following record has a `remoteId` key that is assigned by a
server:

```typescript
{
  type: 'planet',
  id: '34677136-c0b7-4015-b9e5-57f6fdd16bd2',
  keys: {
    remoteId: '123456'
  }
}
```

The `remoteId` key of `123456` can be mapped to the locally generated `id` using
a [`RecordKeyMap`](./api/records/classes/RecordKeyMap.md), which can be shared
by any sources that need access to the mapping. When communicating with the
server, `remoteId` might be serialized as `id`—such a translation should occur
within the source that communicates directly with the remote server (e.g.
Orbit's standard [`JSONAPISource`](./api/jsonapi/classes/JSONAPISource.md)).

### Attributes

Any properties that define a record's data, with the exception of relationships
to other records, should be defined as "attributes".

All attributes should be contained in an `attributes` object at the root of a
record.

### Relationships

Relationships between records should be defined in a `relationships` object at
the root of a record.

Relationship linkage is specified in a `data` object for each relationship.

For to-one relationships, linkage should be expressed as a record identity
object in the form `{ type, id }`. The absence of a relationship can be
expressed as `null`.

For to-many relationships, linkage should be expressed as an array of record
identities.

## Schema

A [`RecordSchema`](./api/records/classes/RecordSchema.md) defines the models allowed in a source, including their keys,
attributes, and relationships. Typically, a single schema is shared among all
the sources in an application.

Schemas are defined with their initial settings as follows:

```typescript
import { RecordSchema } from '@orbit/records';

const schema = new RecordSchema({
  models: {
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
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

Models should be keyed by their singular name, and should be defined as an
object that contains `attributes`, `relationships`, and/or `keys`.

### Model attributes

Attributes may be defined by their `type`, which determines what type of data
they can contain. An attribute's type may also be used to determine how it
should be serialized and validated.

Standard attribute types are:

- `array`
- `boolean`
- `date`
- `datetime`
- `number`
- `object`
- `string`

### Model relationships

Two kinds of relationships between models are allowed:

- `hasOne` - for to-one relationships
- `hasMany` - for to-many relationships

Relationships must define the related `type` and may optionally define their
`inverse`, which should correspond to the name of a relationship on the related
model. Multiple `type` values may be expressed as elements of an array.

Inverse relationships should be defined when relationships must be kept
synchronized, so that adding or removing a relationship on the primary model
results in a corresponding change on the inverse model.

Here's an example of a schema definition that includes relationships with
inverses:

```typescript
import { RecordSchema } from '@orbit/records';

const schema = new RecordSchema({
  models: {
    planet: {
      relationships: {
        moons: { kind: 'hasMany', type: ['moon', 'satellite'], inverse: 'planet' }
      }
    },
    moon: {
      relationships: {
        planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
      }
    }
  }
});
```

### Model keys

When working with remote servers that do not support client-generated IDs, it's
necessary to correlate locally generated IDs with remotely generated IDs, or
"keys". Like `id`, keys uniquely identify a record of a particular model type.

In the simplest case, keys can be declared with an empty options object as
follows:

```typescript
const schema = new RecordSchema({
  models: {
    moon: {
      keys: { remoteId: {} }
    },
    planet: {
      keys: { remoteId: {} }
    }
  }
});
```

Like attributes and relationships, keys can also be declared with options that
are specific to validation or serialization.

:::info

Since keys can only be of type `"string"`, it is unnecessary to explicitly
declare this (although `{ type: "string" }` is technically allowed in a key's
declaration).
:::

:::info

A key such as `remoteId` might be serialized as simply `id` when communicating
with a server. However, it's important to distinguish it from the
client-generated `id` used within Orbit, so it requires a unique name.
:::
