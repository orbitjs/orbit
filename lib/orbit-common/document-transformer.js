import { eq } from 'orbit/lib/eq';
import { Class } from 'orbit/lib/objects';

function append(otherCollection, options){
  otherCollection.forEach(function(item){
    options.to.push(item);
  });
}

export default Class.extend({
  init: function(schema, retrieve, transformTarget, processors){
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
    concatRelatedOps(this.before(operation));
    performRelatedOps();

    // Query related `after` operations before performing
    // the requested operation
    concatRelatedOps(this.after(operation));

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
  },

  before: function(operation){
    var ops = [];

    this._processors.forEach(function(processor) {
      Array.prototype.push.apply(ops, processor.before(operation));
    });

    return ops;
  },

  after: function(operation) {
    var ops = [];

    this._processors.forEach(function(processor) {
      Array.prototype.push.apply(ops, processor.after(operation));
    });

    return ops;    
  },

  finally: function(operation) {
    var ops = [];

    this._processors.forEach(function(processor) {
      Array.prototype.push.apply(ops, processor.finally(operation));
    });

    return ops;    
  }
});
