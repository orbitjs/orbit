import { Observable } from 'rxjs/Observable';

export function fromOrbitEvent(emitter, event) {
  return Observable.create(observer => {
    emitter.on(event, payload => {
      observer.next(payload);
    });
  });
}
