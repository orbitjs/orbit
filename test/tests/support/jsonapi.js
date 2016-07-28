import { Promise } from 'rsvp';

export function jsonapiResponse(status, _data = {}) {
  const headers = {};

  let data = JSON.stringify(_data);
  headers['Content-Type'] = 'application/vnd.api+json';

  const response = new window.Response(
    data,
    { status, headers }
  );

  return Promise.resolve(response);
}
