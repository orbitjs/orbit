/* globals fetch */
import Orbit from 'orbit/main';
import { Promise } from 'rsvp';

Orbit.Promise = Promise;
Orbit.fetch = fetch;

Orbit.pluralize = function(original) {
  return original.match(/s$/) ? original : original + 's';
};

Orbit.singularize = function(original) {
  const match = original.match(/(.*)s$/);
  return match ? match[1] : original;
};
