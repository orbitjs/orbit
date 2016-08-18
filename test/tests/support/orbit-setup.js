import Orbit from 'orbit';
import { Promise } from 'rsvp';

Orbit.Promise = Promise;

Orbit.pluralize = function(original) {
  return original.match(/s$/) ? original : original + 's';
};

Orbit.singularize = function(original) {
  const match = original.match(/(.*)s$/);
  return match ? match[1] : original;
};
