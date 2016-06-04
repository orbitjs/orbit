import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import HasOneObservable from './has-one-observable';
import HasManyObservable from './has-many-observable';
import 'orbit-common/rxjs/add/operator/matching';
import { identity } from 'orbit-common/lib/identifiers';

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
    return this.matching({ record: identity(record) });
  }

  forHasOne(record, relationship) {
    return HasOneObservable.fromObservable(this, this.cache, record, relationship);
  }

  forHasMany(record, relationship) {
    return HasManyObservable.fromObservable(this, this.cache, record, relationship);
  }

  static fromObservable(observable, cache) {
    return new CacheObservable(observable.subscribe.bind(observable), cache);
  }
}
