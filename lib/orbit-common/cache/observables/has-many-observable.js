import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/concat';
import 'orbit-common/rxjs/operators/matching';
import RecordsObservable from './records-observable';

export default class HasManyObservable extends Observable {
  constructor(subscribe, cache, record, relationship) {
    super(subscribe);
    this.cache = cache;
    this.record = record;
    this.relationship = relationship;
  }

  lift(operator) {
    const observable = new HasManyObservable();
    observable.source = this;
    observable.operator = operator;
    observable.cache = this.cache;
    observable.record = this.record;
    observable.relationship = this.relationship;
    return observable;
  }

  membershipChanges() {
    return this.map(operation => {
      const relatedRecord = operation.relatedRecord;

      switch (operation.op) {
        case 'addToHasMany': return { op: 'addRecord', record: relatedRecord };
        case 'removeFromHasMany': return { op: 'removeRecord', record: relatedRecord };
        default: throw new Error(`relatedRecords operator does not support: ${operation.op}`);
      }
    });
  }

  currentMembers(initial = false) {
    const initialValue = Observable.fromArray(initial ? [this._fetchCurrentMembers()] : []);
    const currentMembers = this.map(operation => this._fetchCurrentMembers());
    const merged = Observable.concat(initialValue, currentMembers);

    return RecordsObservable.fromObservable(merged, this.cache);
  }

  _fetchCurrentMembers() {
    const resultSet = this.cache.query(q => q.relatedRecords(this.record.type, this.record.id, this.relationship));
    const resultArray = Object.keys(resultSet).map(id => resultSet[id]);
    return resultArray;
  }

  static fromCacheObservable(cacheObservable, record, relationship) {
    const patches = cacheObservable.matching({ op: ['addToHasMany', 'removeFromHasMany'], relationship });
    const subscribe = patches.subscribe.bind(patches);

    return new HasManyObservable(subscribe, cacheObservable.cache, record, relationship);
  }
}
