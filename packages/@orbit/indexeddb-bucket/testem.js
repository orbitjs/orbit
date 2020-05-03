module.exports = {
  test_page: 'tests/index.html',
  on_start: 'yarn prepare:tests && yarn build:tests',
  on_change: 'yarn build:tests',
  src_files: ['src/**/*', 'test/**/*'],
  launch_in_ci: ['Chrome'],
  launch_in_dev: ['Chrome'],
  browser_start_timeout: 120,
  browser_args: {
    Chrome: {
      ci: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.CI ? '--no-sandbox' : null,
        '--headless',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--remote-debugging-port=0',
        '--window-size=1440,900'
      ].filter(Boolean)
    }
  }
};
