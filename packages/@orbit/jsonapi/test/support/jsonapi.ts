import Orbit from '@orbit/core';

declare const self: any;

export function jsonapiResponse(_options, body?) {
  let options;
  let response;

  if (typeof _options === 'number') {
    options = { status: _options };
  } else {
    options = _options || {};
  }
  options.statusText = options.statusText || statusText(options.status);
  options.headers = options.headers || {};

  if (body) {
    options.headers['Content-Type'] = 'application/vnd.api+json';
    response = new self.Response(JSON.stringify(body), options);
  } else {
    response = new self.Response(options);
  }

  // console.log('jsonapiResponse', body, options, response.headers.get('Content-Type'));

  return Orbit.Promise.resolve(response);
}

function statusText(code) {
  switch (code) {
    case 200:
      return 'OK';
    case 201:
      return 'Created';
    case 204:
      return 'No Content';
    case 422:
      return 'Unprocessable Entity';
  }
}
