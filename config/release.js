// config/release.js
var spawn = require('child_process').spawn;

module.exports = {
  // Build the project before continuing with a release.
  beforeCommit: function(project) {
    return new Promise(function(resolve, reject) {
      proc = spawn('npm', ['run', 'build'], { stdio: 'inherit'});
      proc.on('close', function() {
        console.log('npm run build - completed successfully!')
        resolve();
      });
      proc.on('error', function(err) {
        console.error('npm run build - ERROR!', err);
        reject();
      });
    });
  }
};
