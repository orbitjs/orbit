---
title: Querying data
---

The contents of a source can be interrogated using a `Query`. Orbit comes with a
standard set of query expressions for finding records and related records. These
expressions can be paired with refinements (e.g. filters, sort order, etc.).

Custom query expressions can also be developed, as long as all the sources
participating can understand them.

## Query expressions

The `QueryExpression` interface requires one member:

- `op` - a string identifying the type of query operation

The other members of a `QueryExpression` are specific to the `op`.

The following standard query expressions are defined in `@orbit/data`:

```typescript
interface QueryExpression {
  op: string;
}

interface FindRecord extends QueryExpression {
  op: "findRecord";
  record: RecordIdentity;
}

interface FindRelatedRecord extends QueryExpression {
  op: "findRelatedRecord";
  record: RecordIdentity;
  relationship: string;
}

interface FindRelatedRecords extends QueryExpression {
  op: "findRelatedRecords";
  record: RecordIdentity;
  relationship: string;
  sort?: SortSpecifier[];
  filter?: FilterSpecifier[];
  page?: PageSpecifier;
}

interface FindRecords extends QueryExpression {
  op: "findRecords";
  type?: string;
  sort?: SortSpecifier[];
  filter?: FilterSpecifier[];
  page?: PageSpecifier;
}
```

Supporting interfaces include:

```typescript
export type SortOrder = "ascending" | "descending";

export interface SortSpecifier {
  kind: string;
  order: SortOrder;
}

export interface AttributeSortSpecifier extends SortSpecifier {
  kind: "attribute";
  attribute: string;
}

export type ComparisonOperator = "equal" | "gt" | "lt" | "gte" | "lte";

export interface FilterSpecifier {
  op: ComparisonOperator;
  kind: string;
}

export interface AttributeFilterSpecifier extends FilterSpecifier {
  kind: "attribute";
  attribute: string;
  value: any;
}

export interface PageSpecifier {
  kind: string;
}

export interface OffsetLimitPageSpecifier extends PageSpecifier {
  kind: "offsetLimit";
  offset?: number;
  limit?: number;
}
```

## Queries

The `Query` interface has the following members:

- `id` - a string that uniquely identifies the query
- `expression` - a `QueryExpression` object
- `options` - an optional object that represents options that can influence how
  a query is processed

Although queries can be created "manually", you'll probably find it easier
to use a builder function that returns a query.

To use a query builder, pass a function into a source's method that expects
a query, such as `query` or `pull`. A `QueryBuilder` that's compatible
with the source should be applied as an argument. You can then use this builder
to create a query expression.

### Standard queries

You can use the standard `@orbit/data` query builder as follows:

```javascript
// Find a single record by identity
memory.query(q => q.findRecord({ type: "planet", id: "earth" }));

// Find all records by type
memory.query(q => q.findRecords("planet"));

// Find a related record in a to-one relationship
memory.query(q => q.findRelatedRecord({ type: "moon", id: "io" }, "planet"));

// Find related records in a to-many relationship
memory.query(q =>
  q.findRelatedRecords({ type: "planet", id: "earth" }, "moons")
);
```

The base `findRecords` query can be enhanced significantly:

```javascript
// Sort by name
memory.query(q => q.findRecords('planet')
                  .sort('name'));

// Sort by classification, then name (descending)
memory.query(q => q.findRecords('planet')
                  .sort('classification', '-name'));

// Filter by a single attribute
memory.query(q => q.findRecords('planet')
                  .filter({ attribute: 'classification', value: 'terrestrial' });

// Filter by multiple attributes
memory.query(q => q.findRecords('planet')
                  .filter({ attribute: 'classification', value: 'terrestrial' },
                          { attribute: 'mass', op: 'gt', value: 987654321 });

// Filter by related records
memory.query(q => q.findRecords('moons')
                  .filter({ relation: 'planet', record: { type: 'planet', id: 'earth' }});

// Filter by multiple related records
memory.query(q => q.findRecords('moons')
                  .filter({ relation: 'planet', records: [{ type: 'planet', id: 'earth' }, { type: 'planet', id: 'jupiter'}]});

// Paginate by offset and limit
memory.query(q => q.findRecords('planet')
                  .page({ offset: 0, limit: 10 }));

// Combine filtering, sorting, and paginating
memory.query(q => q.findRecords('planet')
                  .filter({ attribute: 'classification', value: 'terrestrial' })
                  .sort('name')
                  .page({ offset: 0, limit: 10 }));
```

The same parameters can be applied to `findRelatedRecords`:

```javascript
// Sort by name
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                  .sort('name'));

// Sort by classification, then name (descending)
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                  .sort('classification', '-name'));

// Filter by a single attribute
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                  .filter({ attribute: 'classification', value: 'terrestrial' });

// Filter by multiple attributes
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                  .filter({ attribute: 'classification', value: 'terrestrial' },
                          { attribute: 'mass', op: 'gt', value: 987654321 });

// Filter by related records
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'moons')
                  .filter({ relation: 'planet', record: { type: 'planet', id: 'earth' }});

// Filter by multiple related records
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'moons')
                  .filter({ relation: 'planet', records: [{ type: 'planet', id: 'earth' }, { type: 'planet', id: 'jupiter'}]});

// Paginate by offset and limit
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                  .page({ offset: 0, limit: 10 }));

// Combine filtering, sorting, and paginating
memory.query(q => q.findRelatedRecords({ id: 'solar', type: 'planetarySystem' }, 'planets')
                  .filter({ attribute: 'classification', value: 'terrestrial' })
                  .sort('name')
                  .page({ offset: 0, limit: 10 }));
```

#### findRelatedRecords vs findRecords.filter({ relation: ..., record: ... })

If you're using the default settings for JSONAPISource, `findRelatedRecords` and `findRecords.filter(...)` produce very different URLs.

```
const relatedRecordId = { type: 'planet', id: 'earth' };

// This fetches from: /planets/earth/moons
memory.query(q => q.findRelatedRecords(relatedRecordId, 'moons'));

// This fetches from: /moons?filter[planet]=earth
memory.query(q => q.findRecords('moon')).filter({ relation: 'planet', record: relatedRecordId });
```

### Query options

Options can be added to queries to provide processing instructions to particular
sources and to include metadata about queries.

For example, the following query is given a `label` and contains instructions
for the source named `remote`:

```javascript
memory.query(q => q.findRecords("contact").sort("lastName", "firstName"), {
  label: "Find all contacts",
  sources: {
    remote: {
      include: ["phone-numbers"]
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

## Querying a memory source's cache

Note that `memory.query` is asynchronous and thus returns results wrapped in a
promise. This may seem strange at first because the memory source's data is "in memory".
In fact, if you want to just "peek" into the contents of the memory source,
you can issue the same queries synchronously against the memory source's `Cache`.
For example:

```javascript
// Results will be returned synchronously by querying the cache
let planets = memory.cache.query(q => q.findRecords("planet").sort("name"));
```

> By querying the cache instead of the memory source, you're not allowing other
> sources to participate in the fulfillment of the query. If you want to
> coordinate queries across multiple sources, it's critical to make requests
> directly on the memory source.
