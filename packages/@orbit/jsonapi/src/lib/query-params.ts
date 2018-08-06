function flattenObjectToParams(obj, path = []) {
  let params = [];

  Object.keys(obj).forEach(key => {
    if (!obj.hasOwnProperty(key)) { return; }

    let newPath = path.slice();
    newPath.push(key);

    if (obj[key] !== null && typeof obj[key] === 'object') {
      Array.prototype.push.apply(params, flattenObjectToParams(obj[key], newPath));
    } else {
      params.push({
        path: newPath,
        val: obj[key]
      });
    }
  });

  return params;
}

export function encodeQueryParams(obj) {
  return flattenObjectToParams(obj)
    .map(param => {
      if (param.path.length === 1) {
        param.path = param.path[0];
      } else {
        let firstSegment = param.path[0];
        let remainingSegments = param.path.slice(1);
        param.path = firstSegment + '[' + remainingSegments.join('][') + ']';
      }
      return param;
    })
    .map(param => encodeURIComponent(param.path) + '=' + encodeURIComponent(param.val))
    .join('&');
}

export function appendQueryParams(url: string, obj: object): string {
  let fullUrl = url;
  let queryParams = encodeQueryParams(obj);
  if (queryParams.length > 0) {
    if (fullUrl.indexOf('?') === -1) {
      fullUrl += '?';
    } else {
      fullUrl += '&';
    }
    fullUrl += queryParams;
  }
  return fullUrl;
}
