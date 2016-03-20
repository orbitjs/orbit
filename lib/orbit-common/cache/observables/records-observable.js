import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/concatAll';
import PatternMatcher from 'orbit/lib/pattern-matcher';


export default class RecordsObservable extends Observable {
  constructor(subscribe, cache) {
    super(subscribe);
    this.cache = cache;
  }

  lift(operator) {
    const observable = new RecordsObservable();
    observable.source = this;
    observable.operator = operator;
    observable.cache = this.cache;
    return observable;
  }

  patches() {
    return this.mergeMap(records => {
      return records.map(record => this.cache.patches.forRecord(record));
    })
    .last()
    .concatAll();
  }

  static fromObservable(observable, cache) {
    const subscribe = observable.subscribe.bind(observable);

    return new RecordsObservable(subscribe, cache);
  }
}
