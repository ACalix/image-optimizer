function start(fileCount, dirSize) {
  console.log('### Before optimizing ###');
  console.log(`Files: ${fileCount}`);
  console.log(`Total Size: ${dirSize}KB`);
  console.log('#########################');
}

function end(fileCount, dirSize, originalSize) {
  const totalSizeReduced = originalSize - dirSize;
  const totalSizeReducedPercent = 100 - Math.round((dirSize / originalSize) * 100);
  console.log('### After optimizing ###');
  console.log(`Files:  ${fileCount}`);
  console.log(`Total Size: ${dirSize}KB`);
  console.log(`Total size reduced by: ${totalSizeReduced}KB (${totalSizeReducedPercent}%)`);
  console.log('#########################');
}

export default {
  start,
  end
};
