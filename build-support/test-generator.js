/*

 Taken from ember-cli-eslint
 https://github.com/ember-cli/ember-cli-eslint/blob/834da255942e521672ac85d8813adaa876ad892b/ember-cli-build.js

*/

var path = require('path');
var jsStringEscape = require('js-string-escape');

function render(errors) {
  if (!errors) {
    return '';
  }
  return errors.map(function (error) {
    return error.line + ':' + error.column + ' ' +
      ' - ' + error.message + ' (' + error.ruleId + ')';
  }).join('\n');
}

// Qunit test generator
module.exports = function eslintTestGenerator(relativePath, errors) {
  var pass = errors.length === 0;
  return (
    "module('ESLint - " + path.dirname(relativePath) + "');\n" +
    "test('" + relativePath + " should pass ESLint', function(assert) {\n" +
    "  assert.ok(" + pass + ", '" + relativePath + " should pass ESLint." +
    jsStringEscape("\n" + render(errors)) + "');\n" +
    "});\n"
  );
};
