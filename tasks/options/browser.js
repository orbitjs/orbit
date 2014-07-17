module.exports = {
  dist: {
    options: {
      name: function(file) {
        file = file.replace('tmp/built/intermediate/', '');
        file = file.replace('.browser.js', '');
        return file;
      },
      modules: function(name) {
        switch (name) {
          case 'orbit':
            return [{
              namespace: 'Orbit',
              name: 'orbit'
            }];

          case 'orbit-common':
            return [{
              namespace: 'OC',
              name: 'orbit-common'
            }];

          case 'orbit-common-jsonapi':
            return [{
              namespace: 'OC.JSONAPISource',
              name: 'orbit-common/jsonapi-source'
            }, {
              namespace: 'OC.JSONAPISerializer',
              name: 'orbit-common/jsonapi-serializer'
            }];

          case 'orbit-common-local-storage':
            return [{
              namespace: 'OC.LocalStorageSource',
              name: 'orbit-common/local-storage-source'
            }];          

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
