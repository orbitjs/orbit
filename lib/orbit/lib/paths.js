import { isArray } from './objects';

function joinPath(path) {
  if (isArray(path)) {
    if (path.length === 0) {
      return '/';
    } else {
      return '/' + path.join('/');
    }
  } else {
    return path;
  }
}

function splitPath(path) {
  if (typeof path === 'string') {
    if (path.indexOf('/') === 0) {
      path = path.substr(1);
    }

    if (path.length === 0) {
      return [];
    } else {
      if (path[path.length - 1] === '/') {
        path = path.substr(0, path.length - 1);
      }
      return path.split('/');
    }

  } else {
    return path;
  }
}

export {
  joinPath,
  splitPath
};
