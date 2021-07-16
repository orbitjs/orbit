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

```javascript
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

### Identity

Each record's identity is established by a union of the following fields:

- `type` - a string that identifies a set of records with a shared definition
- `id` - a string that uniquely identifies a record of a given `type`

Both fields must be defined in order for a record to be identified uniquely.

Applications can take one of the following approaches to managing identity:

1. Auto-generate IDs, typically as v4 UUIDs, and then use the same IDs locally
   and remotely.

2. Auto-generate IDs locally and map those IDs to canonical IDs (or "keys")
   generated remotely.

3. Remotely generate IDs and don't reference records until those IDs have been
   assigned.

The first two approaches are "optimistic" and allow for offline usage, while
the third is "pessimistic" and requires persistent connectivity.

> Note: It's possible to mix these approaches for different types of records
> (i.e. models) within a given application.

### Keys

When using locally-generated IDs, Orbit uses "keys" to support mapping between
local and remote IDs.

Remote IDs should be kept in a `keys` object at the root of a record.

For example, the following record has a `remoteId` key that is assigned by a
server:

```javascript
{
  type: 'planet',
  id: '34677136-c0b7-4015-b9e5-57f6fdd16bd2',
  keys: {
    remoteId: '123456'
  }
}
```

The `remoteId` key of `123456` can be mapped to the locally generated `id` using
a `KeyMap`, which can be shared by any sources that need access to the mapping.
When communicating with the server, `remoteId` might be serialized as `id`—such
a translation should occur within the source that communicates directly with the
remote server (e.g. Orbit's standard `JSONAPISource`).

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

A `Schema` defines the models allowed in a source, including their keys,
attributes, and relationships. Typically, a single schema is shared among all
the sources in an application.

Schemas are defined with their initial settings as follows:

```javascript
import { Schema } from "@orbit/data";

const schema = new Schema({
  models: {
    planet: {
      attributes: {
        name: { type: "string" },
        classification: { type: "string" }
      },
      relationships: {
        moons: { type: "hasMany", model: "moon", inverse: "planet" }
      }
    },
    moon: {
      attributes: {
        name: { type: "string" }
      },
      relationships: {
        planet: { type: "hasOne", model: "planet", inverse: "moons" }
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
should be serialized. Valid attribute types are:

- `boolean`
- `date`
- `date-time`
- `number`
- `string`

### Model relationships

Two types of relationships between models are allowed:

- `hasOne` - for to-one relationships
- `hasMany` - for to-many relationships

Relationships must define the related `model` and may optionally define their
`inverse`, which should correspond to the name of a relationship on the related
model. Inverse relationships should be defined when relationships must be kept
synchronized, so that adding or removing a relationship on the primary model
results in a corresponding change on the inverse model.

Here's an example of a schema definition that includes relationships with
inverses:

```javascript
import { Schema } from "@orbit/data";

const schema = new Schema({
  models: {
    planet: {
      relationships: {
        moons: { type: "hasMany", model: "moon", inverse: "planet" }
      }
    },
    moon: {
      relationships: {
        planet: { type: "hasOne", model: "planet", inverse: "moons" }
      }
    }
  }
});
```

### Model name inflections

By default, Orbit uses very simple inflections, or pluralization/singularization
of model names - e.g. `user <-> users`. Depending on your API, you may need to
handle this yourself. A common error from same is where `countries` gets converted
to `countrie`, as the `s` is programatically removed from it when it's singularized.

You can override the Orbit inflectors via the Schema factory, e.g.

```javascript
new Schema({
  models,
  pluralize,
  singularize
});
```

There are several inflection packages available on NPM, or you can keep it super
simple for a small application and do something like the following, where a simple
map containing your model names and their inflections can be kept up to date with
your models.

```javascript
const inflect = {
  country: 'countries',
  countries: 'country',
  ...
}

new Schema({
  models,
  pluralize: word => inflect[word],
  singularize: word => inflect[word]
})
```

### Model keys

When working with remote servers that do not support client-generated IDs, it's
necessary to correlate locally generated IDs with remotely generated IDs, or
"keys". Like `id`, keys uniquely identify a record of a particular model type.

Keys currently accept no _standard_ options, so they should be declared with an
empty options hash as follows:

```javascript
const schema = new Schema({
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

> Note: Keys can only be of type `"string"`, which is unnecessary to declare.

> Note: A key such as `remoteId` might be serialized as simply `id` when
> communicating with a server. However, it's important to distinguish it from the
> client-generated `id` used within Orbit, so it requires a unique name.

### Record initialization

Schemas support the ability to initialize records via an
`initializeRecord()` method that takes a record (`Record`) argument.
Currently, `initializeRecord` just assigns an `id` to a record if the field
is undefined. It may be extended to allow per-model defaults to be set as well.

Here's an example that creates a schema and initializes a record:

```javascript
import { Schema } from "@orbit/schema";

const schema = new Schema({
  models: {
    planet: {
      attributes: {
        name: { type: "string" }
      }
    }
  }
});

let earth = {
  type: "planet",
  attributes: {
    name: "Earth"
  }
};

schema.initializeRecord(earth);

console.log(earth.id); // "4facf3cc-7270-4b5e-aedd-94d777d31c31"
```

The default implementation of `initializeRecord` internally calls the schema's
`generateId()` method to generate an `id`. By default, this invokes
`Orbit.uuid()` to generate a v4 UUID (where `Orbit` is the default export from
`@orbit/core`).

It's possible to override `generateId` for a given schema to use a different
local ID scheme. Here's a naive example:

```javascript
let counter = 0;

const schema = new Schema({
  generateId(type) {
    return counter++;
  }
});
```
