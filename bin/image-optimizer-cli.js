#!/usr/bin/env node
const semver = require('semver');
const program = require('commander');
const { formatPath } = require('../dist/utils');
const { run } = require('../dist/image-optimize');

if (semver.satisfies(process.version, '<6.0.0')) {
  console.warn('\x1b[33m%s\x1b[0m', 'Your mileage may vary on node versions < v6.0.0');
}
if (semver.satisfies(process.version, '<7.6.x')) {
  require('babel-polyfill');
}

const options = {};
program
  .version('1.0.0')
  .usage('[options] <IMGTYPE> <PATH>')
  .option('-a, --audit <TRESHHOLD>', 'Check which files will be optimized', '')
  .option('-v, --verbose', 'Make some noise', '')
  .option('-m, --multicore', 'Allow optimizers to run in parallel', '')
  .arguments('<IMGTYPE> <PATH>')
  .action((IMGTYPE, PATH) => {
    const result = formatPath(PATH, IMGTYPE);
    options.imgDir = result.imgDir;
    options.fileType = result.fileType;
    options.imgType = IMGTYPE;
  })
  .parse(process.argv);

if (program.verbose && program.multicore) {
  program.verbose = false;
  console.warn('Verbose flag is not supported for multicore option');
}

run(options.imgDir, options.fileType, options.imgType, program);
