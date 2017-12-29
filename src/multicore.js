const cluster = require('cluster');
let cpuCount = require('os').cpus().length;
let workerPool = [];

/*
 * This module will always initialize as many cores as are available.
 * Upon request to optimize, if the number of files to optimize is fewer than
 * the amount of cores on the system - excess cores will be terminated.
 */
if (cluster.isMaster) {
  for (let i = 0; i < cpuCount; i++) {
    workerPool.push(cluster.fork());
  }

} else if (cluster.isWorker) {
  process.on('message', msg => {
    const file = JSON.parse(msg);
    const optimizer = require('./optimize').initOptimizer(file.type);
    optimizer.run(file.src, './tmp/' + file.src)
    .then(result => {
      process.send(JSON.stringify(result));
    })
    .catch(err => { throw err });
  });
}

function optimizeFast(files, type) {
  return new Promise((resolve, reject) => {
    if (cluster.isMaster) {
      let result = [];
      if (files.length < cpuCount) {
        for (let i = 0, j = (cpuCount - files.length); i < j; i++) {
          cpuCount--;
          workerPool[cpuCount].kill();
        }
      }
      for (let i = 0; i < cpuCount; i++) {
        workerPool[i].send(JSON.stringify({ src: files.shift(), type }));
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
