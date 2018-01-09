const { execFile } = require('child_process');
const { getSizeKB } = require('./utils');

let optimizer;
class Optimizer {
  constructor(fileType) {
    switch (fileType) {
      case 'png':
        this.binary = require('pngquant-bin');
        this.options = ['-o'];
        break;
      case 'jpg':
        this.binary = require('jpegtran-bin');
        this.options = ['-copy', 'none', '-progressive', '-optimize', '-outfile'];
        break;
      default:
        console.log('Invalid <IMGTYPE>');
        process.exit();
    }
  }

  run(src, dest) {
    return new Promise((resolve, reject) => {
      execFile(this.binary, [...this.options, dest, src], (err) => {
        if (err) {
          reject(err);
        }
        const sizeBefore = getSizeKB(src);
        const sizeAfter = getSizeKB(dest);
        let changePercent = 100 - Math.round((sizeAfter / sizeBefore) * 100);
        changePercent = Math.max(0, changePercent);

        resolve({
          src,
          dest,
          srcSize: sizeBefore,
          destSize: sizeAfter,
          changePercent
        });
      });
    });
  }
}

export function initOptimizer(type) {
  if (optimizer !== null) {
    return new Optimizer(type);
  }
  return optimizer;
}

export async function optimizeBatch(files, type, tmpdir) {
  const optimizer = new Optimizer(type);
  const runningOptimizers = [];
  const fileChange = [];

  for (let i = 0, j = files.length; i < j; i += 1) {
    const file = files[i];
    runningOptimizers.push(optimizer.run(file, tmpdir + file)
      .then((result) => {
        const index = fileChange.length + 1;
        process.stdout.write(`${index}. ${result.src} is complete... (${result.changePercent}% reduction)\n`);
        return fileChange.push(result);
      })
      .catch((error) => { console.error(error); }));
  }
  await Promise.all(runningOptimizers);
  return fileChange;
}

