const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const glob = require('glob');

function formatPath(imgPath, imgFileType) {
  const fileTypes = {
    png: '**/*.png',
    jpg: '**/*.jpg'
  };
  let imgDir, fileType;

  try {
  	imgPath = path.normalize(imgPath);
  	const pathStats = fs.statSync(imgPath);

  	if (pathStats.isDirectory()) {
  		if (imgPath[imgPath.length-1] !== '/')
  			imgPath = imgPath + '/';
  		imgDir = imgPath;
      fileType = fileTypes[imgFileType];
  	}

  	if (pathStats.isFile()) {
  		imgDir = path.dirname(imgPath) + '/';
  		fileType = path.basename(imgPath);
  	}
    return { imgDir, fileType }
  } catch(e) {
  	console.log('Invalid PATH');
  	process.exit();
  }
}

function makeTmpDirectory(files) {
  for (let i = 0; i < files.length; i++) {
    const dir = './tmp/' + path.dirname(files[i]);
  	fsExtra.mkdirsSync(dir);
  }
}

function getSizeInfo(path, callback) {
  glob(path, function(err, files) {
    if (err) {
      callback(err);
      return;
    }
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
      const stats = fs.statSync(files[i]);
      const fileSizeInBytes = stats.size;
      totalSize+= fileSizeInBytes;
    }

    callback(null, {files: files, size: totalSize});
  });
}

function getSizeKB(file) {
  const bytes = fs.statSync(file).size;
  return Math.round(bytes / 1024);
}

module.exports = {
  getSizeInfo,
  getSizeKB,
  formatPath,
  makeTmpDirectory
};
