# @orbit/memory

An in-memory data source that supports complex querying and updating. Because
memory sources maintain data in immutable data structures, they can be efficiently
forked. Forked sources can diverge from the master source, and then any changes
can be merged later.

## Installation

Install with yarn:

```
yarn add @orbit/memory
```

Or with npm:

```
npm install @orbit/memory
```

## Contributing

### Installation

To install dependencies:

```
pnpm i
```

### Building

Distributions can be built to the `/dist` directory by running:

```
pnpm build
```

### Testing

#### CI Testing

Test in CI mode by running:

```
pnpm test
```

#### Browser Testing

Test within a browser
(at [http://localhost:8080/](http://localhost:8080/)) by running:

```
pnpm start
```

## License

Copyright 2014-2025 Cerebris Corporation. MIT License (see LICENSE for details).
