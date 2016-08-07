import { Promise } from 'rsvp';

export function jsonapiResponse(_options, _body) {
  const body = JSON.stringify(_body || {});
  let options;

  if (typeof _options === 'number') {
    options = { status: _options };
  } else {
    options = _options || {};
  }

  options.statusText = options.statusText || statusText(options.status);
  options.headers = options.headers || {};
  options.headers['Content-Type'] = 'application/vnd.api+json';
  const response = new window.Response(body, options);

  console.log(body, options);

  return Promise.resolve(response);
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
