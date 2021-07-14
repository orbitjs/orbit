---
id: "index"
title: "@orbit/data"
slug: "/api/data"
sidebar_label: "Readme"
sidebar_position: 0
custom_edit_url: null
---

# @orbit/data

Applies the primitives from @orbit/core to data sources. Includes the following
elements:

- A schema for defining models, including attributes and relationships.

- Operations used to manipulate records (e.g. `addRecord`, `removeRecord`,
  `addToHasMany`, etc.).

- Transforms, which are composed of any number of operations, and must be
  performed transactionally.

- A query language that allows query expressions to be composed in a flexible
  AST form.

- A base `Source` class that can be used to abstract any source of data.
  Sources can be decorated as `pullable`, `pushable`, `queryable`, `syncable`,
  and/or `updatable` - each decorator provides a unique interface that allows
  for transforms and queries to be applied as appropriate.

### Installation

Install with yarn:

```
yarn add @orbit/data
```

Or with npm:

```
npm install @orbit/data
```

## Contributing

### Installation

To install dependencies:

```
yarn install
```

### Building

Distributions can be built to the `/dist` directory by running:

```
yarn build
```

### Testing

#### CI Testing

Test in CI mode by running:

```
yarn test
```

#### Browser Testing

Test within a browser
(at [http://localhost:8080/](http://localhost:8080/)) by running:

```
yarn start
```

## License

Copyright 2014-2020 Cerebris Corporation. MIT License (see LICENSE for details).
