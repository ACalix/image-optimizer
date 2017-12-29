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
        this.options = ['-progressive', '-optimize', '-outfile'];
        break;
      default:
        console.log('Invalid <IMGTYPE>');
        process.exit();
    }
  }

  run(src, dest) {
    return new Promise((resolve, reject) => {
      execFile(this.binary, [...this.options, dest, src], function(err) {
        if (err) {
          reject(err);
        }
        const sizeBefore = getSizeKB(src);
        const sizeAfter = getSizeKB(dest);
        var changePercent = 100 - Math.round(sizeAfter / sizeBefore * 100);
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

function initOptimizer(type) {
  if (optimizer !== null) {
    return new Optimizer(type);
  } else {
    return optimizer;
  }
}

async function optimizeBatch(files, type) {
  const optimizer = new Optimizer(type);
  let fileChange = [];

  for (let i = 0, j = files.length; i < j; i ++) {
    let file = files[i];
    process.stdout.write(i + ". Processing file: " + file+' ... ');
    try {
      let fileOutput = await optimizer.run(file, './tmp/' + file);
      fileChange.push(fileOutput);
      console.log('done! ('+fileOutput.changePercent+'%)');
    } catch (e) {
      console.log(e);
    }
  }
  return fileChange;
}

module.exports = {
  optimizeBatch,
  Optimizer,
  initOptimizer
};
