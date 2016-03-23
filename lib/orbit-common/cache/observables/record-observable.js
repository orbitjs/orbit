import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/concatAll';
import 'orbit-common/rxjs/add/operator/matching';
import CacheObservable from './cache-observable';


export default class RecordObservable extends Observable {
  constructor(subscribe, cache) {
    super(subscribe);
    this.cache = cache;
  }

  lift(operator) {
    const observable = new RecordObservable();
    observable.source = this;
    observable.operator = operator;
    observable.cache = this.cache;
    return observable;
  }

  patches() {
    const recordPatches = this.map(record => {
      return this.cache.patches.matching({ record: { id: record.id } });
    }).switch();

    return CacheObservable.fromObservable(recordPatches, this.cache);
  }

  static fromObservable(observable, cache) {
    const subscribe = observable.subscribe.bind(observable);

    return new RecordObservable(subscribe, cache);
  }
}
