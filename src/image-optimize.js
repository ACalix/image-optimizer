import fsExtra from 'fs-extra';
import confirm from 'confirm-simple';
import log from './log';
import { optimizeBatch } from './optimize';
import {
  getSizeInfo,
  makeTmpDirectory,
  removeTmpDir } from './utils';

function replaceSrcFiles(src, optimized) {
  return new Promise((resolve, reject) => {
    confirm('Do you want to replace the original folder?', (ok) => {
      if (ok) {
        const copyOptions = {
          clobber: true
        };
        fsExtra.copy(src, optimized, copyOptions, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Done copying files back to original location');
            resolve(0);
          }
        });
      } else {
        resolve(0);
      }
    });
  });
}

function printFiles(files, threshold) {
  for (let i = 0, j = files.length; i < j; i += 1) {
    if (files[i].changePercent >= threshold) {
      process.stdout.write(`${files[i].src}\n`);
    }
  }
}

function getDestSize(files) {
  let sum = 0;
  for (let i = 0, j = files.length; i < j; i += 1) {
    sum += files[i].destSize;
  }
  return sum;
}

let tmpDir;
async function run(imgDir, fileType, imgType, program) {
  try {
    const result = await getSizeInfo(imgDir + fileType);
    tmpDir = makeTmpDirectory(result.files);
    const originalSize = Math.round((result.size) / 1024);
    if (result.files.length === 0) {
      console.log(`No ${imgType} found`);
      process.exit();
    }
    if (program.verbose) {
      log.start(result.files, originalSize);
    }

    const files = await optimizeBatch(result.files, imgType, tmpDir);
    if (program.verbose) {
      const optimizedSize = getDestSize(files);
      log.end(files.length, optimizedSize, originalSize);
    }
    if (program.audit) {
      printFiles(files, program.audit);
    } else {
      await replaceSrcFiles(tmpDir + imgDir, imgDir);
    }
    removeTmpDir(tmpDir);
  } catch (e) {
    throw e;
  }
}

process.on('SIGINT', () => {
  if (tmpDir) {
    removeTmpDir(tmpDir);
  }
});

module.exports = {
  run
};
