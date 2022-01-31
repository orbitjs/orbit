const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Orbit.js',
  tagline: 'The Universal Data Layer',
  url: 'https://orbitjs.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  trailingSlash: false,
  organizationName: 'orbitjs',
  projectName: 'orbitjs.com',
  themeConfig: {
    navbar: {
      logo: {
        alt: 'Orbit.js',
        src: 'img/orbitjs-text.svg'
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs'
        },
        {
          type: 'doc',
          docId: 'api/index',
          position: 'left',
          label: 'API'
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left'
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
          dropdownItemsAfter: [
            {
              to: '/versions',
              label: 'All versions'
            }
          ]
        },
        {
          href: 'https://github.com/orbitjs/orbit',
          className: 'header-github-link',
          // label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro'
            }
          ]
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Gitter',
              href: 'https://gitter.im/orbitjs/orbit.js'
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/orbitjs'
            },
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/orbit.js'
            }
          ]
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog'
            },
            {
              label: 'GitHub',
              href: 'https://github.com/orbitjs/orbit'
            }
          ]
        }
      ],
      copyright: `Copyright © 2014-${new Date().getFullYear()} Cerebris Corporation.`
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme
    }
  },
  plugins: [
    'docusaurus-plugin-sass',
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-coordinator',
        out: 'api/coordinator',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/coordinator/src/index.ts'],
        tsconfig: '../packages/@orbit/coordinator/tsconfig.json',
        readme: '../packages/@orbit/coordinator/readme.md',
        sidebar: {
          categoryLabel: '@orbit/coordinator',
          position: 1,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-core',
        out: 'api/core',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/core/src/index.ts'],
        tsconfig: '../packages/@orbit/core/tsconfig.json',
        readme: '../packages/@orbit/core/readme.md',
        sidebar: {
          categoryLabel: '@orbit/core',
          position: 2,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-data',
        out: 'api/data',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/data/src/index.ts'],
        tsconfig: '../packages/@orbit/data/tsconfig.json',
        readme: '../packages/@orbit/data/readme.md',
        sidebar: {
          categoryLabel: '@orbit/data',
          position: 3,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-identity-map',
        out: 'api/identity-map',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/identity-map/src/index.ts'],
        tsconfig: '../packages/@orbit/identity-map/tsconfig.json',
        readme: '../packages/@orbit/identity-map/readme.md',
        sidebar: {
          categoryLabel: '@orbit/identity-map',
          position: 4,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-immutable',
        out: 'api/immutable',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/immutable/src/index.ts'],
        tsconfig: '../packages/@orbit/immutable/tsconfig.json',
        readme: '../packages/@orbit/immutable/readme.md',
        sidebar: {
          categoryLabel: '@orbit/immutable',
          position: 5,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-indexeddb',
        out: 'api/indexeddb',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/indexeddb/src/index.ts'],
        tsconfig: '../packages/@orbit/indexeddb/tsconfig.json',
        readme: '../packages/@orbit/indexeddb/readme.md',
        sidebar: {
          categoryLabel: '@orbit/indexeddb',
          position: 6,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-indexeddb-bucket',
        out: 'api/indexeddb-bucket',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/indexeddb-bucket/src/index.ts'],
        tsconfig: '../packages/@orbit/indexeddb-bucket/tsconfig.json',
        readme: '../packages/@orbit/indexeddb-bucket/readme.md',
        sidebar: {
          categoryLabel: '@orbit/indexeddb-bucket',
          position: 7,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-jsonapi',
        out: 'api/jsonapi',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/jsonapi/src/index.ts'],
        tsconfig: '../packages/@orbit/jsonapi/tsconfig.json',
        readme: '../packages/@orbit/jsonapi/readme.md',
        sidebar: {
          categoryLabel: '@orbit/jsonapi',
          position: 8,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-local-storage',
        out: 'api/local-storage',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/local-storage/src/index.ts'],
        tsconfig: '../packages/@orbit/local-storage/tsconfig.json',
        readme: '../packages/@orbit/local-storage/readme.md',
        sidebar: {
          categoryLabel: '@orbit/local-storage',
          position: 9,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-local-storage-bucket',
        out: 'api/local-storage-bucket',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/local-storage-bucket/src/index.ts'],
        tsconfig: '../packages/@orbit/local-storage-bucket/tsconfig.json',
        readme: '../packages/@orbit/local-storage-bucket/readme.md',
        sidebar: {
          categoryLabel: '@orbit/local-storage-bucket',
          position: 10,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-memory',
        out: 'api/memory',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/memory/src/index.ts'],
        tsconfig: '../packages/@orbit/memory/tsconfig.json',
        readme: '../packages/@orbit/memory/readme.md',
        sidebar: {
          categoryLabel: '@orbit/memory',
          position: 11,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-record-cache',
        out: 'api/record-cache',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/record-cache/src/index.ts'],
        tsconfig: '../packages/@orbit/record-cache/tsconfig.json',
        readme: '../packages/@orbit/record-cache/readme.md',
        sidebar: {
          categoryLabel: '@orbit/record-cache',
          position: 12,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-records',
        out: 'api/records',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/records/src/index.ts'],
        tsconfig: '../packages/@orbit/records/tsconfig.json',
        readme: '../packages/@orbit/records/readme.md',
        sidebar: {
          categoryLabel: '@orbit/records',
          position: 13,
          fullNames: true
        },

      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-serializers',
        out: 'api/serializers',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/serializers/src/index.ts'],
        tsconfig: '../packages/@orbit/serializers/tsconfig.json',
        readme: '../packages/@orbit/serializers/readme.md',
        sidebar: {
          categoryLabel: '@orbit/serializers',
          position: 14,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-utils',
        out: 'api/utils',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/utils/src/index.ts'],
        tsconfig: '../packages/@orbit/utils/tsconfig.json',
        readme: '../packages/@orbit/utils/readme.md',
        sidebar: {
          categoryLabel: '@orbit/utils',
          position: 15,
          fullNames: true
        },
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-validators',
        out: 'api/validators',
        theme: 'default',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        entryPoints: ['../packages/@orbit/validators/src/index.ts'],
        tsconfig: '../packages/@orbit/validators/tsconfig.json',
        readme: '../packages/@orbit/validators/readme.md',
        sidebar: {
          categoryLabel: '@orbit/validators',
          position: 16,
          fullNames: true
        },
      }
    ]
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          lastVersion: 'current',
          versions: {
            current: {
              label: '0.17'
            }
          },
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/orbitjs/orbit/edit/main/website/'
        },
        blog: {
          path: 'blog',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All Blog Posts',
          showReadingTime: true,
          editUrl: 'https://github.com/orbitjs/orbit/edit/main/website/',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © 2014-${new Date().getFullYear()} Cerebris Corporation`,
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss')
        }
      }
    ]
  ]
};
