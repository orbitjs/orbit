import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/empty';
import 'orbit-common/rxjs/operators/matching';
import RecordsObservable from './records-observable';

function extractRecordFromHasOneResult(value) {
  if (!value) { return null; }

  const id = Object.keys(value)[0];
  return value[id];
}

export default class HasOneObservable extends Observable {
  constructor(subscribe, cache, record, relationship) {
    super(subscribe);
    this.cache = cache;
    this.record = record;
    this.relationship = relationship;
  }

  lift(operator) {
    const observable = new HasOneObservable();
    observable.source = this;
    observable.operator = operator;
    observable.cache = this.cache;
    observable.record = this.record;
    observable.relationship = this.relationship;
    return observable;
  }

  relationshipChanges() {
    const currentRelatedRecord = this._fetchCurrentRelatedRecord();
    const initialOperation = { record: currentRelatedRecord };

    return this.scan((previous, operation) => {
      if (operation.relatedRecord) { return { op: 'addRecord', record: operation.relatedRecord }; }
      if (previous && previous.record) { return { op: 'removeRecord', record: previous.record }; }
      return operation;
    }, initialOperation)
    .filter(operation => ['addRecord', 'removeRecord'].indexOf(operation.op) !== -1);
  }

  _fetchCurrentRelatedRecord() {
    const result = this.cache.query(q => q.relatedRecord(this.record.type, this.record.id, this.relationship));
    return extractRecordFromHasOneResult(result);
  }

  currentRelatedRecord(initial = false) {
    let currentMember = this.map(() => this._fetchCurrentRelatedRecord());

    if (initial) {
      currentMember = currentMember.startWith(this._fetchCurrentRelatedRecord());
    }

    return HasOneObservable.fromCacheObservable(currentMember, this.cache, this.record, this.relationship);
  }

  patches() {
    return this.currentRelatedRecord().map(record => {
      console.log(record);
      return this.cache.patches.forRecord(record);
    }).last().concatAll();
  }

  static fromCacheObservable(observable, cache, record, relationship) {
    const patches = observable.matching({ op: 'replaceHasOne', record, relationship });
    const subscribe = patches.subscribe.bind(patches);

    return new HasOneObservable(subscribe, cache, record, relationship);
  }
}
