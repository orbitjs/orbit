import Orbit from 'orbit/main';
import { Promise } from 'rsvp';
import jQuery from 'jquery';

Orbit.Promise = Promise;
Orbit.ajax = jQuery.ajax;

Orbit.pluralize = function(original) {
  return original.match(/s$/) ? original : original + 's';
};

Orbit.singularize = function(original) {
  const match = original.match(/(.*)s$/);
  return match ? match[1] : original;
};
