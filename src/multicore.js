const cluster = require('cluster');
let cpuCount = require('os').cpus().length;

const workerPool = [];
/*
 * This module will always initialize as many cores as are available.
 * Upon request to optimize, if the number of files to optimize is fewer than
 * the amount of cores on the system - excess cores will be terminated.
 */
if (cluster.isMaster) {
  for (let i = 0; i < cpuCount; i += 1) {
    workerPool.push(cluster.fork());
  }
} else if (cluster.isWorker) {
  let tmpdir;
  process.on('message', (msg) => {
    const file = JSON.parse(msg);
    if (file.tmpdir) {
      tmpdir = file.tmpdir;
    }
    const optimizer = require('./optimize').initOptimizer(file.type);
    optimizer.run(file.src, tmpdir + file.src)
      .then(result => process.send(JSON.stringify(result)))
      .catch(err => { throw err });
  });
}

function optimizeFast(files, type, tmpdir) {
  return new Promise((resolve, reject) => {
    if (cluster.isMaster) {
      const result = [];
      if (files.length < cpuCount) {
        for (let i = 0, j = (cpuCount - files.length); i < j; i += 1) {
          cpuCount -= 1;
          workerPool[cpuCount].kill();
        }
      }
      for (let i = 0; i < cpuCount; i += 1) {
        workerPool[i].send(JSON.stringify({ src: files.shift(), type, tmpdir }));
      }

      cluster.on('exit', () => {
        if (!workerPool.some(worker => !worker.isDead())) {
          resolve(result);
        }
      });

      cluster.on('message', (worker, message) => {
        const optimizedFile = JSON.parse(message);
        result.push(optimizedFile);
        console.log(`Optimized ${optimizedFile.changePercent}%: ${optimizedFile.src}`);

        if (files.length > 0) {
          worker.send(JSON.stringify({ src: files.shift(), type }));
        } else {
          worker.kill();
        }
      });
    }
  });
}

module.exports = optimizeFast;
