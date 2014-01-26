var PathNotFoundException = function(path) {
  this.path = path;
};

PathNotFoundException.prototype = {
  constructor: PathNotFoundException
};

export { PathNotFoundException };