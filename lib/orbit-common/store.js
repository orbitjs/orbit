import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToHasManyOperation,
  removeFromHasManyOperation,
  replaceHasOneOperation,
  replaceHasManyOperation,
  operationType
} from 'orbit-common/lib/operations';
import {
  queryExpression as oqe
} from 'orbit-common/oql/expressions';
import MemorySource from 'orbit-common/memory-source';
import {
  toIdentifier,
  parseIdentifier
} from 'orbit-common/lib/identifiers';

export default MemorySource.extend({

  init(options) {
    this._super.call(this, options);

    this.cache.on('patch', operation => this._emitOperation(operation));
  },

  /////////////////////////////////////////////////////////////////////////////
  // Query helpers
  /////////////////////////////////////////////////////////////////////////////

  findRecordsByType(type) {
    return this.query({ oql: oqe('get', [type]) })
      .then((records) => {
        if (records) {
          return Object.keys(records).map((k) => records[k]);
        } else {
          return [];
        }
      });
  },

  findRecord(type, id) {
    return this.query({ oql: oqe('get', [type, id]) });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transform helpers
  /////////////////////////////////////////////////////////////////////////////

  addRecord(record) {
    return this.transform(addRecordOperation(this.schema.normalize(record)))
      .then(() => {
        return this.cache.get([record.type, record.id]);
      });
  },

  replaceRecord(record) {
    return this.transform(replaceRecordOperation(this.schema.normalize(record)));
  },

  removeRecord(recordIdentifier) {
    return this.transform(removeRecordOperation(parseIdentifier(recordIdentifier)));
  },

  replaceAttribute(recordIdentifier, attribute, value) {
    return this.transform(replaceAttributeOperation(parseIdentifier(recordIdentifier), attribute, value));
  },

  addToHasMany(recordIdentifier, relationship, value) {
    return this.transform(addToHasManyOperation(parseIdentifier(recordIdentifier), relationship, parseIdentifier(value)));
  },

  removeFromHasMany(recordIdentifier, relationship, value) {
    return this.transform(removeFromHasManyOperation(parseIdentifier(recordIdentifier), relationship, parseIdentifier(value)));
  },

  replaceHasMany(recordIdentifier, relationship, value) {
    return this.transform(replaceHasManyOperation(parseIdentifier(recordIdentifier), relationship, value.map(identifier => parseIdentifier(identifier))));
  },

  replaceHasOne(recordIdentifier, relationship, value) {
    return this.transform(replaceHasOneOperation(parseIdentifier(recordIdentifier), relationship, parseIdentifier(value)));
  },

  _emitOperation(operation) {
    switch (operationType(operation)) {
      case 'addRecord':
        return this._emit('addRecord', operation.value);

      case 'replaceRecord': // never called
        return this._emit('replaceRecord', operation.value);

      case 'removeRecord':
        return this._emit('removeRecord', toIdentifier(operation.path[0], operation.path[1]));

      case 'replaceAttribute':
        return this._emit('replaceAttribute', operation.path[3], operation.value);

      case 'addToHasMany':
        return this._emit('addToHasMany', toIdentifier(operation.path[0], operation.path[1]), operation.path[3], operation.path[5]);

      case 'removeFromHasMany': // never called
        return this._emit('removeFromHasMany', toIdentifier(operation.path[0], operation.path[1]), operation.path[3], operation.path[5]);

      case 'replaceHasMany':
        return this._emit('replaceHasMany', toIdentifier(operation.path[0], operation.path[1]), operation.path[3], Object.keys(operation.value));

      case 'replaceHasOne':
        return this._emit('replaceHasOne', toIdentifier(operation.path[0], operation.path[1]), operation.path[3], operation.value);

      default: console.log('ignored', operation);
    }
  },

  _emit(...args) {
    console.log('emitting', ...args);
    this.emit(...args);
  }
});
