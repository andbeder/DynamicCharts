const semver = require('semver');
const required = '>=18 <21';
if (!semver.satisfies(process.version, required)) {
  console.error(`Error: Node.js ${required} required. Current version ${process.version}.`);
  process.exit(1);
}
