Rx.Observable.prototype.mapConcurrently = function (maxConcurrency, callback) {
  var source = this;

  return Rx.Observable.create(function (observer) {
    source
      .map(data => Rx.Observable.defer(() => {
        return callback(data);
      }))
      .merge(maxConcurrency)
      .subscribe(observer);
  });
};
