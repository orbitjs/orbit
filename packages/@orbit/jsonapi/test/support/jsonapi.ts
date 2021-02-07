import { Orbit } from '@orbit/core';

export async function jsonapiResponse(
  _options: unknown,
  body?: unknown,
  delay?: number
): Promise<Response> {
  let options: any;
  let response: Response;

  if (typeof _options === 'number') {
    options = { status: _options };
  } else {
    options = _options || {};
  }
  options.statusText = options.statusText || statusText(options.status);
  options.headers = options.headers || {};

  if (body) {
    options.headers['Content-Type'] =
      options.headers['Content-Type'] || 'application/vnd.api+json';
    response = new Orbit.globals.Response(JSON.stringify(body), options);
  } else {
    response = new Orbit.globals.Response(null, options);
  }

  // console.log('jsonapiResponse', body, options, response.headers.get('Content-Type'));

  if (delay) {
    return new Promise((resolve: (response: Response) => void) => {
      let timer = Orbit.globals.setTimeout(() => {
        Orbit.globals.clearTimeout(timer);
        resolve(response);
      }, delay);
    });
  } else {
    return response;
  }
}

function statusText(code: number): string | undefined {
  switch (code) {
    case 200:
      return 'OK';
    case 201:
      return 'Created';
    case 204:
      return 'No Content';
    case 304:
      return 'Not Modified';
    case 404:
      return 'Not Found';
    case 422:
      return 'Unprocessable Entity';
  }
}
