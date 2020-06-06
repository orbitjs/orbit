const walkSync = require("walk-sync");
const fs = require("fs");
const path = require("path");
const resolve = require('resolve');
const rimraf = require("rimraf");

const TEST_DIR = "tests-static";

function buildTests() {
  let name = getPackageName();
  let target = process.argv[2];

  console.log(`Building tests for: ${name}, target: ${target}`);

  buildTestsDir();
  buildTestIndexJs();
  buildTestIndexHtml(name, target);
}

function getPackageName() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'))).name;
}

function buildTestsDir() {
  const testsDir = path.join(process.cwd(), TEST_DIR);
  rimraf.sync(testsDir);
  fs.mkdirSync(testsDir);

  const qunitPath = resolve.sync('qunit');
  const qunitDir = path.dirname(qunitPath);
  ['qunit.js', 'qunit.css'].forEach(f => {
    fs.copyFileSync(path.join(qunitDir, f), path.join(testsDir, f));
  });
}

function buildTestIndexJs() {
  let inputDir = path.join(process.cwd(), "/test");
  let destFile = path.join(process.cwd(), "./test/index.ts");

  let modules = [];
  let paths = walkSync(inputDir);
  paths.forEach((path) => {
    if (path.indexOf("-test.") > -1) {
      let name = path.split(".")[0];
      modules.push(name);
    }
  });

  let imports = modules.map((module) => {
    return `import './${module}';`;
  });
  let contents =
    "// DO NOT EDIT - This is an auto-generated index of tests and will be overwritten.\n" +
    imports.join("\n") +
    "\n";

  return fs.writeFileSync(destFile, contents);
}

function buildTestIndexHtml(name, target) {
  let destFile = path.join(process.cwd(), TEST_DIR,  "index.html");

  let contents = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8">',
    `  <title>${name} tests</title>`,
    '  <link rel="stylesheet" href="qunit.css">',
    '</head>',
    '<body>',
    '  <div id="qunit"></div>',
    '  <div id="qunit-fixture"></div>',
    '  <script src="qunit.js"></script>',
    '  <script type="module" src="_dist_/test/index.js"></script>'
  ];
  if (target === 'ci') {
    contents.push(
      '  <script src="/testem.js"></script>',
    );
  }
  contents = contents.concat([
    '</body>',
    '</html>'
  ]);

  return fs.writeFileSync(destFile, contents.join("\n") + '\n');
}

module.exports = buildTests;
