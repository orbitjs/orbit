import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './versions.module.scss';

const versions = require('../../versions.json');

const VersionItem = ({version, currentVersion}) => {
  const versionName = version === 'next' ? 'Main' : version;

  const isCurrentVersion = currentVersion === version;
  const isNext = version === 'next';
  const isRC = version.toUpperCase().indexOf('-RC') !== -1;

  const latestMajorVersion = versions[0].toUpperCase().replace('-RC', '');
  const documentationLink = (
    <a
      href={useBaseUrl(
        'docs/' + (isCurrentVersion ? '' : version + '/') + 'intro'
      )}>
      Documentation
    </a>
  );
  let releaseNotesURL = 'https://github.com/orbitjs/orbit/releases';
  let releaseNotesTitle = 'Changelog';
  if (isNext) {
    releaseNotesURL = `https://github.com/orbitjs/orbit/compare/release-${latestMajorVersion.replace('.', '-')}...main`;
    releaseNotesTitle = 'Commits since ' + latestMajorVersion;
  } else if (!isRC) {
    releaseNotesURL = `https://github.com/orbitjs/orbit/releases/tag/v${version}.0`;
  }

  const releaseNotesLink = <a href={releaseNotesURL}>{releaseNotesTitle}</a>;

  return (
    <tr>
      <th>{versionName}</th>
      <td>{documentationLink}</td>
      <td>{releaseNotesLink}</td>
    </tr>
  );
};

const Versions = () => {
  const currentVersion = versions.length > 0 ? versions[0] : null;
  const latestVersions = ['next'].concat(
    versions.filter(version => version.indexOf('-RC') !== -1)
  );
  const stableVersions = versions.filter(
    version => version.indexOf('-RC') === -1 && version !== currentVersion
  );

  return (
    <Layout title="Versions">
      <main className={styles.versionsPage}>
        <h1>Orbit.js versions</h1>
        <h2>Next version (Unreleased)</h2>
        <table className={styles.versions}>
          <tbody>
            {latestVersions.map(version => (
              <VersionItem
                key={'version_' + version}
                version={version}
                currentVersion={currentVersion}
              />
            ))}
          </tbody>
        </table>
        <h2>Latest version</h2>
        <table className={styles.versions}>
          <tbody>
            <VersionItem
              key={'version_' + currentVersion}
              version={currentVersion}
              currentVersion={currentVersion}
            />
          </tbody>
        </table>
        <h2>Previous versions</h2>
        <table className={styles.versions}>
          <tbody>
            {stableVersions.map(version => (
              <VersionItem
                key={'version_' + version}
                version={version}
                currentVersion={currentVersion}
              />
            ))}
          </tbody>
        </table>
      </main>
    </Layout>
  );
};

export default Versions;
