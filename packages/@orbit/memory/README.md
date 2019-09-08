# @orbit/memory

An in-memory data source that supports complex querying and updating. Because
memory sources maintain data in immutable data structures, they can be efficiently
forked. Forked sources can diverge from the master source, and then any changes
can be merged later.

## Installation

```
yarn add @orbit/memory
```

## Contributing

### Installation

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
(at [http://localhost:4200/tests/](http://localhost:4200/tests/)) by running:

```
yarn testem
```

## License

Copyright 2014-2019 Cerebris Corporation. MIT License (see LICENSE for details).
