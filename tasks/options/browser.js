module.exports = {
  dist: {
    options: {
      name: function(file) {
        file = file.replace('tmp/built/intermediate/', '');
        file = file.replace('.browser.js', '');
        return file;
      },
      namespace: function(name) {
        switch (name) {
          case 'orbit':
            return 'Orbit';

          case 'orbit-common':
            return 'OC';

          case 'orbit-common-jsonapi':
            return 'OC.JSONAPISource';

          case 'orbit-common-local-storage':
            return 'OC.LocalStorageSource';

          default:
            this.fail.warn('Unrecognized file: `' + name + '`.');
        }
      },
      module: function(name) {
        switch (name) {
          case 'orbit':
            return 'orbit';

          case 'orbit-common':
            return 'orbit_common';

          case 'orbit-common-jsonapi':
            return 'orbit_common/jsonapi_source';

          case 'orbit-common-local-storage':
            return 'orbit_common/local_storage_source';

          default:
            this.fail.warn('Unrecognized file: `' + name + '`.');
        }
      },
      preDefine: function(name) {
        if (name !== 'orbit') {
          return [
            "var define = global.Orbit.__defineModule__;",
            "var requireModule = global.Orbit.__requireModule__;"
          ];
        }
      },
      postRequire: function(name) {
        if (name === 'orbit') {
          return [
            "global.Orbit.__defineModule__ = define;",
            "global.Orbit.__requireModule__ = requireModule;"
          ];
        }
      }
    },
    files: [{
      expand: true,
      cwd: 'tmp/built/intermediate/',
      src: ['*.browser.js'],
      dest: 'tmp/built/',
      ext: '.js'
    }]
  }
};
