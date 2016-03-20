import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import PatternMatcher from 'orbit/lib/pattern-matcher';
import HasOneObservable from './has-one-observable';
import HasManyObservable from './has-many-observable';
import 'orbit-common/rxjs/operators/matching';

export default class CacheObservable extends Observable {
  constructor(subscribe, cache) {
    super(subscribe);
    this.cache = cache;
  }

  lift(operator) {
    const observable = new CacheObservable();
    observable.source = this;
    observable.operator = operator;
    observable.cache = this.cache;
    return observable;
  }

  forRecord(record) {
    return this.matching({ record: { type: record.type, id: record.id } });
  }

  forHasOne(record, relationship) {
    return HasOneObservable.fromCacheObservable(this, record, relationship);
  }

  forHasMany(record, relationship) {
    return HasManyObservable.fromCacheObservable(this, record, relationship);
  }

  static fromObservable(observable, cache) {
    return new CacheObservable(observable.subscribe.bind(observable), cache);
  }
}
