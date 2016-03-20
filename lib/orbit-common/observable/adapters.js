import { Observable } from 'rxjs/Observable';

function fromOrbitEvent(emitter, event) {
  return Rx.Observable.create(observer => {
    emitter.on(event, payload => {
      observer.onNext(payload);
    });
  });
}

function fromOrbitEvent2(emitter, event) {
  return Observable.create(observer => {
    emitter.on(event, payload => {
      observer.next(payload);
    });
  });
}

export { fromOrbitEvent, fromOrbitEvent2 };
