import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Multiple Data Sources',
    src: '/img/tour/normalized-data.png',
    description: (
      <>
        <p>
          Your application may need to interact with data from a variety of
          sources: a REST server, a WebSocket stream, an IndexedDB backup, an
          in-memory source, etc.
        </p>
        <p>
          Orbit can coordinate data flows across any number of sources through a
          standard set of interfaces using normalized data structures.
        </p>
      </>
    )
  },
  {
    title: 'Uniform Data Access',
    src: '/img/tour/uniform-access.png',
    description: (
      <>
        <p>
          Because Orbit's sources all understand the same expressions for
          querying and mutating data, you can access data in the same
          way regardless of its origin.
        </p>
        <p>
          Orbit also provides an extensible set of serializers to "normalize"
          external data as well as validators to ensure its correctness.
        </p>
      </>
    )
  },
  {
    title: 'Deterministic Change Tracking',
    src: '/img/tour/change-tracking.png',
    description: (
      <>
        <p>
          Data correctness is vital to user trust, so you need a deterministic
          approach to manage it.
        </p>
        <p>
          Orbit uses a Git-like approach to track changes across data sources.
          Changes are expressed as "transforms", which are similar to Git
          commits. Logs provide a per-source history. Like Git repos, sources
          can be diffed, forked, merged, and reset.
        </p>
      </>
    )
  },
  {
    title: 'Optimistic / Pessimistic Requests',
    src: '/img/tour/connections.png',
    description: (
      <>
        <p>
          Not all data can be treated uniformly. Some data is transient, while
          other data can persist for the life of your app. Some changes should
          be made pessimistically and be confirmed by a remote server. Other
          changes can be made optimistically, cached locally, and pushed
          eventually.
        </p>
        <p>
          Orbit provides coordination strategies which can be customized to the
          needs of your application.
        </p>
      </>
    )
  },
  {
    title: 'Offline Support',
    src: '/img/tour/failasaur.svg',
    description: (
      <>
        <p>
          In an increasingly mobile world, it's ideal to keep applications
          available even when the Internet is not.
        </p>
        <p>
          Orbit provides the tools needed to build robust offline experiences.
          Backup your application's state, including data caches, logs, and
          queues, to browser storage. Query and change local data when offline,
          while queueing changes for synchronization when online again.
        </p>
      </>
    )
  },
  {
    title: 'Runs Everywhere',
    src: '/img/tour/browsers-and-node.png',
    description: (
      <>
        <p>
          Orbit can be run in modern browsers as well as in the Node.js runtime.
        </p>
        <p>
          Orbit is written in TypeScript. Its libraries are distributed on npm
          through the @orbit organization in both CJS and ESM formats.
        </p>
      </>
    )
  }
];

function Feature({ src, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureImgContainer}>
        <img src={src} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <section>{description}</section>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
