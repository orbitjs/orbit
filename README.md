# Orbit [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Orbit is a composable data framework for managing the complex needs of today's
web applications.

Although Orbit is primarily used as a flexible client-side ORM, it can also
be used server-side in [Node.js](https://nodejs.org/).

Orbit is designed for applications that need to:

- Interact with data from a variety of sources: a REST server, a WebSocket
  stream, an IndexedDB backup, an in-memory store, etc.

- Work offline, work online, and seamlessly transition between both modes.

- Create optimistic and pessimistic user experiences (and even both in the same
  app).

- Use a common schema to model data, regardless of its source.

- Query and update data with a common set of expressions, understood across
  sources.

- Track changes deterministically.

- Fork immutable stores and then merge changes back if and when ready.

- Support undo / redo.

Orbit is written in [Typescript](https://www.typescriptlang.org) and distributed
on npm through the [@orbit](https://www.npmjs.com/org/orbit) organization.
Pre-built distributions are provided in several module formats and ES language
levels.

## Docs and Guides

Please visit [orbitjs.com](https://orbitjs.com) to learn how to make the
most of Orbit.

## Contributing

Orbit's main packages are maintained in this monorepo and managed by
[lerna](https://lerna.js.org/).

### Installation

Install dependencies:

```
yarn install
```

### Building

Build distributions for all packages:

```
yarn build
```

### Testing

Test all packages:

```
yarn test
```

Or `cd` into each package's dir and test it individually in the browser:

```
cd packages/@orbit/PACKAGE-NAME
yarn testem
```

## License

Copyright 2014-2021 Cerebris Corporation. MIT License (see LICENSE for details).
