import Orbit from 'orbit/main';

function deferred() {
  let deferred = {};

  deferred.promise = new Orbit.Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

export { deferred };
