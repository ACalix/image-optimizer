import fsExtra from 'fs-extra';
import confirm from 'confirm-simple';
import program from 'commander';
import log from './log';
import {
  getSizeInfo,
  formatPath,
  makeTmpDirectory,
  removeTmpDir } from './utils';

let imgType;
let fileType, imgDir, tmpDir;
program
  .version('1.0.0')
  .usage('[options] <IMGTYPE> <PATH>')
  .option('-a, --audit <TRESHHOLD>', 'Check which files will be optimized', '')
  .option('-v, --verbose', 'Make some noise', '')
  .option('-m, --multicore', 'Allow optimizers to run in parallel', '')
  .arguments('<IMGTYPE> <PATH>')
  .action((IMGTYPE, PATH) => {
    const result = formatPath(PATH, IMGTYPE);
    imgDir = result.imgDir;
    fileType = result.fileType;
    imgType = IMGTYPE;
  })
  .parse(process.argv);

if (program.verbose && program.multicore) {
  program.verbose = false;
  console.warn('Verbose flag is not supported for multicore option');
}

const batch = (program.multicore) ? require('./multicore') : require('./optimize').optimizeBatch;

getSizeInfo(imgDir + fileType, (err, result) => {
  if (err) {
    throw err;
  } else if (result.files.length === 0) {
    console.log(`No ${imgType} found`);
    process.exit();
  }
  const originalSize = Math.round((result.size) / 1024);

  if (program.verbose) {
    log.start(result.files, originalSize);
  }

  tmpDir = makeTmpDirectory(result.files);

  batch(result.files, imgType, tmpDir).then((files) => {
    if (program.audit) {
      removeTmpDir(tmpDir);
      printFiles(files, program.audit);
    } else {
      confirm('Would you like to replace these files?', ok => {
        if (ok && program.verbose) {
          let optimizedSize = 0;
          files.forEach(file => optimizedSize += file.destSize);
          log.end(files.length, optimizedSize, originalSize);
          replaceSrcFiles();
        } else if (ok) {
          replaceSrcFiles();
        } else {
          removeTmpDir(tmpDir);
        }
      });
    }
  })
  .catch(err => { throw err });
});

process.on('SIGINT', () => {
  if (tmpDir) {
    removeTmpDir(tmpDir);
  }
});

function replaceSrcFiles() {
  const copyOptions = {
    clobber: true
  };
  fsExtra.copy(tmpDir + imgDir, imgDir, copyOptions, function(err) {
    if (err) {
      console.log('Error copying files back to original location');
    } else {
      console.log('Done copying files back to original location');
      removeTmpDir(tmpDir);
    }
  });
}

function printFiles(files, threshold) {
  for (let i = 0, j = files.length; i < j; i += 1) {
    if (files[i].changePercent >= threshold) {
      process.stdout.write(`${files[i].src}\n`);
    }
  }
}
