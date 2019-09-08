# @orbit/core

A core set of primitives for performing, tracking, and responding to
asynchronous tasks, including:

- An event system that allows listeners to engage with the fulfillment of
  events by returning promises.

- An asynchronous task processing queue.

- A log that tracks a history of changes and allows for revision and
  interrogation.

- A bucket interface for persisting state. Used by logs and queues.

## Installation

```
yarn add @orbit/core
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
