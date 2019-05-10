# @orbit/memory

An in-memory data source that supports complex querying and updating. Because
memory sources maintain data in immutable data structures, they can be efficiently
forked. Forked sources can diverge from the master source, and then any changes
can be merged later.

## Installation

Install with npm:

```
npm install @orbit/memory
```

## Contributing

### Installation

Install the CLI for [Broccoli](https://github.com/broccolijs/broccoli) globally:

```
npm install -g broccoli-cli
```

Install other dependencies:

```
npm install
```

### Building

Distributions can be built to the `/dist` directory by running:

```
npm run build
```

### Testing

#### CI Testing

Test in CI mode by running:

```
npm test
```

Or directly with testem (useful for configuring options):

```
testem ci
```

#### Browser Testing

Test within a browser
(at [http://localhost:4200/tests/](http://localhost:4200/tests/)) by running:

```
testem
```

## License

Copyright 2014-2017 Cerebris Corporation. MIT License (see LICENSE for details).
