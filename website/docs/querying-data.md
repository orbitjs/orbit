---
title: Querying data
---

The contents of a source can be interrogated using a
[`Query`](./api/data/interfaces/Query.md). Orbit comes with a standard set of
query expressions for finding records and related records. These expressions can
be paired with refinements (e.g. filters, sort order, etc.).

Custom query expressions can also be developed, as long as all the sources
participating can understand them.

## Query expressions

The base [`QueryExpression`](./api/data/interfaces/QueryExpression.md) interface
consists of:

- `op` - a string identifying the type of query operation
- `options` - (Optional) a [`RequestOptions`](./api/data/interfaces/RequestOptions.md) object

The other members of a
[`QueryExpression`](./api/data/interfaces/QueryExpression.md) are specific to
the `op`. The following standard record-specific query expressions are defined
in [`@orbit/records`](./api/records/index.md):

```typescript
interface FindRecord extends QueryExpression {
  op: 'findRecord';
  record: RecordIdentity;
}

interface FindRelatedRecord extends QueryExpression {
  op: 'findRelatedRecord';
  record: RecordIdentity;
  relation: string;
}

interface FindRelatedRecords extends QueryExpression {
  op: 'findRelatedRecords';
  record: RecordIdentity;
  relation: string;
  sort?: SortSpecifier[];
  filter?: FilterSpecifier[];
  page?: PageSpecifier;
}

interface FindRecords extends QueryExpression {
  op: 'findRecords';
  type?: string;
  sort?: SortSpecifier[];
  filter?: FilterSpecifier[];
  page?: PageSpecifier;
}
```

Supporting interfaces include:

```typescript
export type SortOrder = 'ascending' | 'descending';

export interface SortSpecifier {
  kind: string;
  order: SortOrder;
}

export interface AttributeSortSpecifier extends SortSpecifier {
  kind: 'attribute';
  attribute: string;
}

export type ComparisonOperator =
  | 'equal'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'some'
  | 'all'
  | 'none';

export interface FilterSpecifier {
  op: ComparisonOperator;
  kind: string;
}

export interface AttributeFilterSpecifier extends FilterSpecifier {
  kind: 'attribute';
  attribute: string;
  value: any;
}

export interface PageSpecifier {
  kind: string;
}

export interface OffsetLimitPageSpecifier extends PageSpecifier {
  kind: 'offsetLimit';
  offset?: number;
  limit?: number;
}
```

## Queries

The [`Query`](./api/data/interfaces/Query.md) interface has the following
members:

- `id` - a string that uniquely identifies the query
- `expressions` - an instance or array of [`QueryExpression`](./api/data/interfaces/QueryExpression.md) objects
- `options` - an optional object that represents options that can influence how
  a query is processed

Although queries can be created "manually", you'll probably find it easier
to use a builder function that returns a query.

To use a query builder, pass a function into a source's method that expects a
query, such as `query`. A `QueryBuilder` that's compatible with the source
should be applied as an argument. You can then use this builder to create query
expressions.

### Standard queries

You can use the standard `@orbit/data` query builder as follows:

```typescript
// Find a single record by identity
memory.query((q) => q.findRecord({ type: 'planet', id: 'earth' }));

// Find all records by type
memory.query((q) => q.findRecords('planet'));

// Find a related record in a to-one relationship
memory.query((q) => q.findRelatedRecord({ type: 'moon', id: 'io' }, 'planet'));

// Find related records in a to-many relationship
memory.query((q) =>
  q.findRelatedRecords({ type: 'planet', id: 'earth' }, 'moons')
);
```

The base `findRecords` query can be enhanced significantly:

```typescript
// Sort by name
memory.query((q) => q.findRecords('planet')
                     .sort('name'));

// Sort by classification, then name (descending)
memory.query((q) => q.findRecords('planet')
                     .sort('classification', '-name'));

// Filter by a single attribute
memory.query((q) => q.findRecords('planet')
                     .filter({ attribute: 'classification', value: 'terrestrial' });

// Filter by multiple attributes
memory.query((q) => q.findRecords('planet')
                     .filter({ attribute: 'classification', value: 'terrestrial' },
                             { attribute: 'mass', op: 'gt', value: 987654321 });

// Filter by related records
memory.query((q) => q.findRecords('moons')
                     .filter({ relation: 'planet', record: { type: 'planet', id: 'earth' }});

// Filter by multiple related records
memory.query((q) => q.findRecords('moons')
                     .filter({ relation: 'planet', records: [{ type: 'planet', id: 'earth' }, { type: 'planet', id: 'jupiter'}]});

// Paginate by offset and limit
memory.query((q) => q.findRecords('planet')
                     .page({ offset: 0, limit: 10 }));

// Combine filtering, sorting, and paginating
memory.query((q) => q.findRecords('planet')
                     .filter({ attribute: 'classification', value: 'terrestrial' })
                     .sort('name')
                     .page({ offset: 0, limit: 10 }));
```

The same parameters can be applied to `findRelatedRecords`:

```typescript
// Sort by name
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                     .sort('name'));

// Sort by classification, then name (descending)
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                     .sort('classification', '-name'));

// Filter by a single attribute
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                     .filter({ attribute: 'classification', value: 'terrestrial' });

// Filter by multiple attributes
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                     .filter({ attribute: 'classification', value: 'terrestrial' },
                             { attribute: 'mass', op: 'gt', value: 987654321 });

// Filter by related records
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'moons')
                     .filter({ relation: 'planet', record: { type: 'planet', id: 'earth' }});

// Filter by multiple related records
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'moons')
                     .filter({ relation: 'planet', records: [{ type: 'planet', id: 'earth' }, { type: 'planet', id: 'jupiter'}]});

// Paginate by offset and limit
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                     .page({ offset: 0, limit: 10 }));

// Combine filtering, sorting, and paginating
memory.query((q) => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                     .filter({ attribute: 'classification', value: 'terrestrial' })
                     .sort('name')
                     .page({ offset: 0, limit: 10 }));
```

## Filtering

As shown in some of the previous examples, you can filter over the records that are found by a `findRecords` or `findRelatedRecords` query. Filtering is done building a boolean expression and only retrieving the records for which this expression returns `true`. This boolean expression, just like it is with regular javascript, is built out of three parts.

Javascript:

```typescript
 const denserThanEarth = planets.filter((planet) => {
    return planet.density    >     earth.density
 }) //    |      1       |   2    |      3      |

```

Filter expression:

```typescript
const denserThanEarth = orbit.cache.query((q) => {
  return q.findRecords('planets')
          .filter({ attribute: 'radius', op: 'lt', value: earth.density })
}) //             |         1          |    2    |          3           |
```

1. the left hand value:
   This is a reference to the property of the records that you want to compare. This can either be a `relationship` or an `attribute`. During evaluation, the reference will be replaced by the actual values of the records.

2. the comparison operation
   The operation determines the way the two values will be compared.

3. the right hand value:
   This is a value that will remain constant for the entirety of the filter. This value determines, given the operation, which records will be returned and which will not.

There are two different kinds of filtering. Filtering on attribute values and filtering on relationship values.
Both have their own comparison operators.

### Attribute filtering

Attribute filtering looks like the following:

```typescript
const denserThanEarth = orbit.cache.query((q) => {
  return q.findRecords('planets')
    .filter({ attribute: 'radius', op: 'lt', value: earth.density })
})
```

For attribute filtering, the following comparison operators are available.

- `equal`: alias for the `===` operator.
- `gt`: alias for the `>` operator.
- `lt`: alias for the `<` operator.
- `gte`: alias for the `>=` operator.
- `lte`: alias for the `<=` operator.

### Relationship filtering

Relationship filtering has two types:

Filtering on a `hasOne` relationship:

```typescript
const moonsOfJupiter = orbit.cache.query((q) => {
  return q.findRecords('moon')
          .filter({ relation: 'planet', op: 'equal', record: { type: 'planet', id: 'jupiter' } })
})
```

Filtering on a `hasMany` relationship:

```typescript
const theSolarSystem = orbit.cache.query((q) => {
  return q.findRecords('planetarySystem')
          .filter({
            relation: 'planets',
            op: 'some',
            records: [{ type: 'planet', id: 'earth' }]
          })
})
```

Note that the filter is on a relationship but the key in the filter is `relation`.

Filtering on a `hasOne` relationship has different comparison operations available than filtering on a `hasMany` relationship.

`hasOne` operations:

- `equal`: returns a record if the left hand relationship is equal to the right hand relationship.

`hasMany` operations:

- `equal`: returns a record if the left hand relationsips are identical to the right hand relationships.
- `all`: returns a record if the left hand relationships contain all the right hand relationships.
- `some`: returns a record if the left hand relationships contain one or more of the right hand relationships.
- `none`: returns a record if none of the left hand relationships are present in the right hand relationships.

#### findRelatedRecords vs findRecords.filter({ relation: ..., record: ... })

If you're using the default settings for
[JSONAPISource](./api/jsonapi/classes/JSONAPISource.md), `findRelatedRecords`
and `findRecords.filter(...)` produce very different URLs.

```typescript
const relatedRecordId = { type: 'planet', id: 'earth' };

// This fetches from: /planets/earth/moons
memory.query((q) => q.findRelatedRecords(relatedRecordId, 'moons'));

// This fetches from: /moons?filter[planet]=earth
memory.query((q) => q.findRecords('moon')).filter({ relation: 'planet', record: relatedRecordId });
```

### Query options

Options can be added to queries to provide processing instructions to particular
sources and to include metadata about queries.

For example, the following query is given a `label` and contains instructions
for the source named `remote`:

```typescript
memory.query((q) => q.findRecords('contact').sort('lastName', 'firstName'), {
  label: 'Find all contacts',
  sources: {
    remote: {
      include: ['phoneNumbers']
    }
  }
});
```

A `label` can be useful for providing an understanding of actions that have been
queued for processing.

The `sources: { ${sourceName}: sourceSpecificOptions }` pattern is used to pass
options that only a particular source will understand when processing a query.
In this instance, we're telling a source named `remote` (let's say it's a
`JSONAPISource`) to include `include=phone-numbers` as a query param. This will
result in a server response that includes contacts together with their related
phone numbers.

It is possible to pass different options to each expression in the query.

```typescript
memory.query((q) => [
  q.findRecords('contact').options({ include: ['phoneNumbers'] }),
  q.findRecords('meeting').options({ include: ['location'] })
]);
```

## Querying a memory source's cache

Note that `memory.query` is asynchronous and thus returns results wrapped in a
promise. This may seem strange at first because the memory source's data is "in memory".
In fact, if you want to just "peek" into the contents of the memory source,
you can issue the same queries synchronously against the memory source's `Cache`.
For example:

```typescript
// Results will be returned synchronously by querying the cache
const planets = memory.cache.query((q) => q.findRecords('planet').sort('name'));
```

> By querying the cache instead of the memory source, you're not allowing other
> sources to participate in the fulfillment of the query. If you want to
> coordinate queries across multiple sources, it's critical to make requests
> directly on the memory source.

### Live queries

You may subscribe to a
[`SyncLiveQuery`](/api/record-cache/classes/SyncLiveQuery.md) on a memory source's cache.
To do so, request a [`SyncLiveQuery`](/api/record-cache/classes/SyncLiveQuery.md)
instance and then subscribe to changes. By default the
[`SyncLiveQuery`](/api/record-cache/classes/SyncLiveQuery.md) will observe cache
`patch` events with a debounce. The subscription callback will be called on
every operation which is relevant to the query.

```typescript
// Create a new LiveQuery instance
const planetsLiveQuery = memory.cache.liveQuery((q) => q.findRecords('planet'));
// Subscribe to LiveQuery changes
const unsubscribe = planetsLiveQuery.subscribe((update) => {
  // Query for results when a change occure
  update.query();
});
// Unsubscribe from the LiveQuery
unsubscribe();
```

:::tip

If you use a pull based reactive system (for example Glimmer tracking) you can
set `debounceLiveQueries` option to `false` on memory cache.
:::
