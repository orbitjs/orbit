function fromOrbitEvent(emitter, event) {
  return Rx.Observable.create(observer => {
    emitter.on(event, payload => {
      observer.onNext(payload);
    });
  });
}

export { fromOrbitEvent };
