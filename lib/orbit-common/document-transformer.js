import { eq } from 'orbit/lib/eq';
import { Class } from 'orbit/lib/objects';

export default Class.extend({
  init: function(retrieve, transformTarget, schema, processors){
    this._retrieve = retrieve;
    this._transformTarget = transformTarget;
    this._schema = schema;

    this._initProcessors(processors);    
  },

  _initProcessors: function(processors) {
    this._processors = processors.map(this._initProcessor, this);
  },

  _initProcessor: function(Processor) {
    return new Processor(this._schema, this._retrieve);
  },  

  transform: function(operation){
    var _this = this;
    var inverse = [];
    var op = operation.op;
    var path = operation.path;
    var value = operation.value;
    var currentValue = this._retrieve(path);
    var relatedOps = [];

    // special case the addition of a `type` collection
    if (op === 'add' && path.length === 1) {
      return this._transformTarget(operation, true);
    }

    if (op === 'add' || op === 'replace') {
      var exists = !!this._retrieve(path.slice(0, path.length - 1), true);
      if (!exists) {
        return;
      }
    }

    if (eq(currentValue, value)) return;

    var concatRelatedOps = function(ops) {
      relatedOps = relatedOps.concat(ops);
    };

    var performRelatedOps = function() {
      relatedOps.forEach(function(o) {
        inverse.push(_this.transform(o));
      });
      relatedOps = [];
    };

    // console.log('Cache#transform', op, path.join('/'), value);

    if (eq(currentValue, value)) return;

    // Query and perform related `before` operations
    this._processors.forEach(function(processor) {
      concatRelatedOps(processor.before(operation));
    });
    performRelatedOps();

    // Query related `after` operations before performing
    // the requested operation
    this._processors.forEach(function(processor) {
      concatRelatedOps(processor.after(operation));
    });

    // Perform the requested operation
    inverse = this._transformTarget(operation, true);

    // Perform related `after` operations after performing
    // the requested operation
    performRelatedOps();

    // Query and perform related `finally` operations
    this._processors.forEach(function(processor) {
      concatRelatedOps(processor.finally(operation));
    });
    performRelatedOps();

    return inverse;
  },

  reset: function(data){
    this._processors.forEach(function(processor) {
      processor.reset(data);
    });    
  }
});
