Rx.Observable.prototype.mapSequentially = function (callback) {
  return Rx.Observable.create(observer => {
    this.mapConcurrently(1, callback).subscribe(observer);
  });
};
