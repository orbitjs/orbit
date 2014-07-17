module.exports = {
  amd: {
    files: {
      'tmp/built/orbit.amd.js': [
          'tmp/transpiled/lib/orbit.amd.js',
          'tmp/transpiled/lib/orbit/**/*.amd.js'],
      'tmp/built/orbit-common.amd.js': [
          'tmp/transpiled/lib/orbit-common.amd.js',
          'tmp/transpiled/lib/orbit-common/**/*.amd.js',
          '!tmp/transpiled/lib/orbit-common/local-storage-source.amd.js',
          '!tmp/transpiled/lib/orbit-common/jsonapi-source.amd.js'],
      'tmp/built/orbit-common-local-storage.amd.js': [
          'tmp/transpiled/lib/orbit-common/local-storage-source.amd.js'],
      'tmp/built/orbit-common-jsonapi.amd.js': [
          'tmp/transpiled/lib/orbit-common/jsonapi-source.amd.js',
          'tmp/transpiled/lib/orbit-common/jsonapi-serializer.amd.js']
    }
  },

  browser: {
    files: {
      'tmp/built/intermediate/orbit.browser.js': [
          'vendor/loader.js',
          'tmp/built/orbit.amd.js'],
      'tmp/built/intermediate/orbit-common.browser.js': [
          'tmp/built/orbit-common.amd.js'],
      'tmp/built/intermediate/orbit-common-local-storage.browser.js': [
          'tmp/built/orbit-common-local-storage.amd.js'],
      'tmp/built/intermediate/orbit-common-jsonapi.browser.js': [
          'tmp/built/orbit-common-jsonapi.amd.js']
    }
  },

  tests: {
    files: {
      'tmp/public/test/tests/tests.amd.js': ['tmp/transpiled/tests/**/*.amd.js']
    }
  }
};
