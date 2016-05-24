import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/concat';
import 'orbit-common/rxjs/add/operator/matching';
import PatternMatcher from 'orbit/lib/pattern-matcher';
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

  relationshipChanges() {
    return this.map(operation => {
      const relatedRecord = operation.relatedRecord;

      switch (operation.op) {
        case 'addToHasMany': return { op: 'addRecord', record: relatedRecord };
        case 'removeFromHasMany': return { op: 'removeRecord', record: relatedRecord };
        default: throw new Error(`relatedRecords operator does not support: ${operation.op}`);
      }
    });
  }

  relatedRecords({ initial = false } = {}) {
    let relatedRecords = this.map(operation => this._fetchRelatedRecords());

    if (initial) {
      relatedRecords = relatedRecords.startWith(this._fetchRelatedRecords());
    }

    return RecordsObservable.fromObservable(relatedRecords, this.cache);
  }

  _fetchRelatedRecords() {
    const resultSet = this.cache.query(q => q.relatedRecords(this.record, this.relationship));
    const resultArray = Object.keys(resultSet).map(id => resultSet[id]);
    return resultArray;
  }

  static fromObservable(observable, cache, record, relationship) {
    const patches = observable.matching({ op: ['addToHasMany', 'removeFromHasMany'], relationship });
    const subscribe = patches.subscribe.bind(patches);

    return new HasManyObservable(subscribe, cache, record, relationship);
  }
}
