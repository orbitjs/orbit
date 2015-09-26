import {Promise} from 'rsvp';

Promise.prototype.spread = function(onFulfillment, onRejection, label) {
  return this.then(function(array) {
    return onFulfillment.apply(void 0, array);
  }, onRejection, label);
};
