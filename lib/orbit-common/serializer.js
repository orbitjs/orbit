import { Class } from 'orbit/lib/objects';
import { required } from 'orbit/lib/stubs';

var Serializer = Class.extend({
  init: function(schema) {
    this.schema = schema;
  },

  serialize: required,

  deserialize: required
});

export default Serializer;
