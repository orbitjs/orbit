import { Dict } from '@orbit/utils';

interface RawParam {
  path: string[];
  val: any;
}

export interface Param {
  path: string;
  val: string;
}

function flattenObjectToParams(obj: any, path: string[] = []): RawParam[] {
  let params: RawParam[] = [];

  Object.keys(obj).forEach((key) => {
    if (!obj.hasOwnProperty(key)) {
      return;
    }

    let newPath = path.slice();
    newPath.push(key);

    if (obj[key] !== null && typeof obj[key] === 'object') {
      Array.prototype.push.apply(
        params,
        flattenObjectToParams(obj[key], newPath)
      );
    } else {
      params.push({
        path: newPath,
        val: obj[key]
      });
    }
  });

  return params;
}

export function encodeQueryParams(obj: Dict<any>): string {
  return flattenObjectToParams(obj)
    .map((rawParam) => {
      let path: string;
      let val = rawParam.val;

      if (val === null) {
        val = 'null';
      }

      if (rawParam.path.length === 1) {
        path = rawParam.path[0];
      } else {
        let firstSegment = rawParam.path[0];
        let remainingSegments = rawParam.path.slice(1);
        path = firstSegment + '[' + remainingSegments.join('][') + ']';
      }
      return { path, val };
    })
    .map(
      (param) =>
        encodeURIComponent(param.path) + '=' + encodeURIComponent(param.val)
    )
    .join('&');
}

export function appendQueryParams(url: string, obj: Dict<string>): string {
  let fullUrl = url;

  if (obj.filter && Array.isArray(obj.filter)) {
    let filter = obj.filter;
    delete obj.filter;

    filter.forEach((filterOption: any) => {
      fullUrl = appendQueryParams(fullUrl, { filter: filterOption });
    });
  }

  let queryParams = encodeQueryParams(obj);
  if (queryParams.length > 0) {
    fullUrl += nextQueryParamIndicator(fullUrl);
    fullUrl += queryParams;
  }
  return fullUrl;
}

function nextQueryParamIndicator(url: string): string {
  if (url.indexOf('?') === -1) {
    return '?';
  }

  return '&';
}
