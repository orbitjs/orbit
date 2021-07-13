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
  organizationName: 'orbitjs', // Usually your GitHub org/user name.
  projectName: 'orbit', // Usually your repo name.
  themeConfig: {
    navbar: {
      // title: 'Orbit.js',
      logo: {
        alt: 'Orbit.js',
        src: 'img/orbitjs-text.svg'
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Guide'
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
        id: 'typedoc-utils',
        out: 'api/utils',
        theme: 'default',
        excludePrivate: true,
        readme: '../packages/@orbit/utils/readme.md',
        packages: ['../packages/@orbit/utils']
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'typedoc-core',
        out: 'api/core',
        theme: 'default',
        excludePrivate: true,
        readme: '../packages/@orbit/core/readme.md',
        packages: ['../packages/@orbit/core']
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'typedoc-data',
        out: 'api/data',
        theme: 'default',
        excludePrivate: true,
        readme: '../packages/@orbit/data/readme.md',
        packages: ['../packages/@orbit/data']
      }
    ]
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/orbitjs/orbit/edit/main/website/'
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/orbitjs/orbit/edit/main/website/blog/'
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss')
        }
      }
    ]
  ]
};
