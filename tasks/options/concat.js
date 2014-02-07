module.exports = {
  amd: {
    files: {
      'tmp/built/orbit.amd.js': [
          'tmp/transpiled/lib/orbit.amd.js',
          'tmp/transpiled/lib/orbit/**/*.amd.js'],
      'tmp/built/orbit-common.amd.js': [
          'tmp/transpiled/lib/orbit_common.amd.js',
          'tmp/transpiled/lib/orbit_common/**/*.amd.js',
          '!tmp/transpiled/lib/orbit_common/local_storage_source.amd.js',
          '!tmp/transpiled/lib/orbit_common/jsonapi_source.amd.js'],
      'tmp/built/orbit-common-local-storage-source.amd.js': [
          'tmp/transpiled/lib/orbit_common_local_storage_source.amd.js',
          'tmp/transpiled/lib/orbit_common/local_storage_source.amd.js'],
      'tmp/built/orbit-common-jsonapi-source.amd.js': [
          'tmp/transpiled/lib/orbit_common_jsonapi_source.amd.js',
          'tmp/transpiled/lib/orbit_common/jsonapi_source.amd.js']
    }
  },

  browser: {
    files: {
      'tmp/built/intermediate/orbit.browser.js': [
          'vendor/loader.js',
          'tmp/built/orbit.amd.js'],
      'tmp/built/intermediate/orbit-common.browser.js': [
          'vendor/loader.js',
          'tmp/built/orbit-common.amd.js'],
      'tmp/built/intermediate/orbit-common-local-storage-source.browser.js': [
          'vendor/loader.js',
          'tmp/built/orbit-common-local-storage-source.amd.js'],
      'tmp/built/intermediate/orbit-common-jsonapi-source.browser.js': [
          'vendor/loader.js',
          'tmp/built/orbit-common-jsonapi-source.amd.js']
    }
  },

  tests: {
    files: {
      'tmp/public/test/tests/tests.amd.js': ['tmp/transpiled/tests/**/*.amd.js']
    }
  }
};
