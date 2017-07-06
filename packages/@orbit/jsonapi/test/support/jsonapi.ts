import Orbit from '@orbit/core';

export function jsonapiResponse(_options, body?, timeout?) {
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
    response = new Orbit.globals.Response(JSON.stringify(body), options);
  } else {
    response = new Orbit.globals.Response(options);
  }

  // console.log('jsonapiResponse', body, options, response.headers.get('Content-Type'));

  if (timeout) {
    return new Orbit.Promise((resolve, reject) => {
        let timer = Orbit.globals.setTimeout(() => {
          Orbit.globals.clearTimeout(timer);
          resolve(response);
        }, timeout);
      });
  } else {
    return Orbit.Promise.resolve(response);
  }
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
