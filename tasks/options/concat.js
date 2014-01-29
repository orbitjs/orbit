module.exports = {
  orbit: {
    src: ['tmp/transpiled/lib/orbit.js', 'tmp/transpiled/lib/orbit/**/*.js'],
    dest: 'tmp/public/test/lib/orbit.js'
  },

  orbit_common: {
    src: ['tmp/transpiled/lib/orbit_common.js', 'tmp/transpiled/lib/orbit_common/**/*.js',
          '!tmp/transpiled/lib/orbit_common/local_storage_source.js',
          '!tmp/transpiled/lib/orbit_common/jsonapi_source.js'],
    dest: 'tmp/public/test/lib/orbit-common.js'
  },

  orbit_local_storage_source: {
    src: ['tmp/transpiled/lib/orbit_common_local_storage_source.js', 'tmp/transpiled/lib/orbit_common/local_storage_source.js'],
    dest: 'tmp/public/test/lib/orbit-common-local-storage-source.js'
  },

  orbit_jsonapi_source: {
    src: ['tmp/transpiled/lib/orbit_common_jsonapi_source.js', 'tmp/transpiled/lib/orbit_common/jsonapi_source.js'],
    dest: 'tmp/public/test/lib/orbit-common-jsonapi-source.js'
  },

  test: {
    src: 'tmp/transpiled/tests/**/*.js',
    dest: 'tmp/public/test/tests/tests.js'
  }
};
