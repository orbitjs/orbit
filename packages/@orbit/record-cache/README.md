# @orbit/record-cache

A record cache is an abstraction used to access and maintain a set of records.

Record caches should extend one of the following base classes:

* `SyncRecordCache` - when records can be accessed synchronously

* `AsyncRecordCache` - when records must be accessed asynchronously


## Installation

Install with npm:

```
npm install @orbit/record-cache
```

## Contributing

### Installation

Install dependencies:

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
npx testem ci
```

#### Browser Testing

Test within a browser
(at [http://localhost:4200/tests/](http://localhost:4200/tests/)) by running:

```
npx testem
```

## License

Copyright 2014-2018 Cerebris Corporation. MIT License (see LICENSE for details).
