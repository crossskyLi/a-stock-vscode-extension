const vsce = require('vsce');

const vscePublishTask = function () {
  return vsce.publish();
};

const vscePackageTask = function () {
  return vsce.createVSIX();
};

export default {
  publish: vscePublishTask,
  buildVSIX: vscePackageTask,
};
