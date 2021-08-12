# @orbit/record-cache

A record cache is an abstraction used to access and maintain a set of records.

Record caches should extend one of the following base classes:

- `SyncRecordCache` - when records can be accessed synchronously

- `AsyncRecordCache` - when records must be accessed asynchronously

## Installation

Install with yarn:

```
yarn add @orbit/record-cache
```

Or with npm:

```
npm install @orbit/record-cache
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

Copyright 2014-2021 Cerebris Corporation. MIT License (see LICENSE for details).
