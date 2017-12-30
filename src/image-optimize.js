const fsExtra = require('fs-extra');
const { getSizeInfo, formatPath, makeTmpDirectory } = require('./utils');
const confirm = require('confirm-simple');

let imgType;
let fileType, imgDir, tmpDir = './tmp/';
const program = require('commander');
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

const batch = (program.multicore) ? require('./multicore') : require('./optimize').optimizeBatch;

getSizeInfo(imgDir + fileType, (err, result) => {
  if (err) { throw err }
  const originalSize = Math.round((result.size) / 1024);

  if (program.verbose) {
    logStart(result.files, originalSize);
  }

	makeTmpDirectory(result.files);

  batch(result.files, imgType).then(files => {
    if (program.audit) {
      removeTmpDir();
      printFiles(files, program.audit);
    } else {
      confirm('Would you like to replace these files?', ok => {
        if (ok && program.verbose) {
          let optimizedSize = 0;
          files.forEach(file => optimizedSize += file.destSize);
          logEnd(files.length, optimizedSize);
          replaceSrcFiles();
        } else if (ok) {
          replaceSrcFiles();
        } else {
          removeTmpDir();
        }
      });
    }
  })
  .catch(err => { throw err });
});

function logStart(fileCount, dirSize) {
  console.log('### Before optimizing ###');
  console.log('Files: ' + fileCount);
  console.log('Total Size: ' + dirSize + 'kb');
  console.log('#########################');
}

function logEnd(fileCount, dirSize, sizeReduced, percentReduced) {
  const totalSizeReduced = originalSize - optimizedSize;
  const totalSizeReducedPercent = 100 - Math.round(optimizedSize / originalSize * 100);
  console.log('### After optimizing ###');
  console.log('Files: ' + fileCount);
  console.log('Total Size: ' + dirSize + 'kb');
  console.log('Total size reduced by: '+sizeReduced+'kb ('+percentReduced+'%)');
  console.log('#########################');
}

function replaceSrcFiles() {
  const copyOptions = {
    clobber: true
  };
  fsExtra.copy(tmpDir + imgDir, imgDir, copyOptions, function(err) {
    if (err) {
      console.log('Error copying files back to original location');
    } else {
      console.log('Done copying files back to original location');
      removeTmpDir();
    }
  });
}

function removeTmpDir(){
  fsExtra.remove(tmpDir, function(err) {
    if (err) {
      console.log('error cleaning tmp files');
    }
    process.exit();
  });
}

function printFiles(files, threshold) {
  for (let i = 0, j = files.length; i < j; i ++) {
    if (files[i].changePercent >= threshold) {
      process.stdout.write(files[i].src + '\n');
    }
  }
}
