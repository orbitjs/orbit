module.exports = {
  orbit: {
    src: ['tmp/transpiled/lib/orbit.js', 'tmp/transpiled/lib/orbit/**/*.js'],
    dest: 'tmp/public/test/lib/orbit.js'
  },

  orbit_core_sources: {
    src: ['tmp/transpiled/lib/orbit_core_sources.js',
          'tmp/transpiled/lib/orbit_core_sources/main.js',
          'tmp/transpiled/lib/orbit_core_sources/lib/**/*.js',
          'tmp/transpiled/lib/orbit_core_sources/source.js',
          'tmp/transpiled/lib/orbit_core_sources/memory_source.js'],
    dest: 'tmp/public/test/lib/orbit_core_sources.js'
  },

  orbit_local_storage_source: {
    src: ['tmp/transpiled/lib/orbit_core_local_storage_source.js', 'tmp/transpiled/lib/orbit_core_sources/local_storage_source.js'],
    dest: 'tmp/public/test/lib/orbit_core_local_storage_source.js'
  },

  orbit_jsonapi_source: {
    src: ['tmp/transpiled/lib/orbit_core_jsonapi_source.js', 'tmp/transpiled/lib/orbit_core_sources/jsonapi_source.js'],
    dest: 'tmp/public/test/lib/orbit_core_jsonapi_source.js'
  },

  test: {
    src: 'tmp/transpiled/tests/**/*.js',
    dest: 'tmp/public/test/tests/tests.js'
  }
};
