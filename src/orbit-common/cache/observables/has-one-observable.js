import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/concatAll';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/empty';
import 'orbit-common/rxjs/add/operator/matching';
import RecordObservable from './record-observable';
import qb from 'orbit-common/query/builder';

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
    const relatedRecord = this._fetchCurrentRelatedRecord();
    const initialOperation = { record: relatedRecord };

    const mapToSetOperations = (previous, operation) => {
      if (operation.relatedRecord) { return { op: 'addRecord', record: operation.relatedRecord }; }
      if (previous && previous.record) { return { op: 'removeRecord', record: previous.record }; }
      return operation;
    };

    return this.scan(mapToSetOperations, initialOperation)
               .matching({ op: ['addRecord', 'removeRecord'] });
  }

  _fetchCurrentRelatedRecord() {
    const result = this.cache.query(qb.relatedRecord(this.record, this.relationship));
    return extractRecordFromHasOneResult(result);
  }

  relatedRecord({ initial = false } = {}) {
    let relatedRecord = this.map(() => this._fetchCurrentRelatedRecord());

    if (initial) {
      relatedRecord = relatedRecord.startWith(this._fetchCurrentRelatedRecord());
    }

    return RecordObservable.fromObservable(relatedRecord, this.cache);
  }

  static fromObservable(observable, cache, record, relationship) {
    const patches = observable.matching({ record: { type: record.type, id: record.id }, op: 'replaceHasOne', relationship });
    const subscribe = patches.subscribe.bind(patches);

    return new HasOneObservable(subscribe, cache, record, relationship);
  }
}
