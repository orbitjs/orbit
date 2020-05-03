const walkSync = require("walk-sync");
const fs = require("fs");
const path = require("path");

function buildTestIndex() {
  let inputDir = path.join(process.cwd(), "/test");
  let destFile = path.join(process.cwd(), "tests/index.js");

  let modules = [];
  let paths = walkSync(inputDir);
  paths.forEach((path) => {
    if (path.indexOf("-test.") > -1) {
      let name = path.split(".")[0];
      modules.push(name);
    }
  });

  let imports = modules.map((module) => {
    return `import './test/${module}';`;
  });
  let contents =
    "// DO NOT EDIT - This file is an auto-generated index of tests.\n" +
    imports.join("\n") +
    "\n";

  return fs.writeFileSync(destFile, contents);
}

module.exports = buildTestIndex();
