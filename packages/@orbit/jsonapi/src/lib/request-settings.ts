import { deepSet } from '@orbit/utils';
import { FetchSettings } from '../jsonapi-source';

export function buildRequestSettings(request, settings: FetchSettings = {}): FetchSettings {
  for (const param of ['filter', 'include', 'page', 'sort']) {
    if (request[param]) {
      deepSet(settings, ['params', param], request[param]);
    }
  }

  if (request.timeout) {
    settings.timeout = request.timeout;
  }

  return settings;
}
