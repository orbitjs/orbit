import { Promise } from 'rsvp';

Promise.prototype.spread = function(onFulfillment, onRejection, label) {
  return this.then(function(array) {
    return onFulfillment.apply(void 0, array);
  }, onRejection, label);
};

Promise.prototype.tap = function(callback) {
  return this.then(function (result) {
    return Promise.resolve(callback(result)).then(() => result);
  });
};
