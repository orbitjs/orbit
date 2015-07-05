import { Class } from './lib/objects';

export default Class.extend({
  operations: null,

  completedOperations: null,

  inverseOperations: null,

  init: function(operations) {
    this.operations = operations ? operations : [];
    this.completedOperations = [];
    this.inverseOperations = [];
  }
});
