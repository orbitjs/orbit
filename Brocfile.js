const build = require('@glimmer/build');
const path = require('path');

module.exports = build({
  testDependencies: [
    path.join(require.resolve('rsvp'), '..', 'rsvp.js')
  ]
});
