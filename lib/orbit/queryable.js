import Evented from './evented';
import { assert } from './lib/assert';

export default {
  extend: function(object, actions) {
    if (object._queryable === undefined) {
      object._queryable = true;
      Evented.extend(object);

      object.query = function() {
        assert('_query must be defined', object._query);

        var args = Array.prototype.slice.call(arguments, 0);

        return object.resolve.apply(object, ['assistQuery'].concat(args)).then(
          undefined,
          function() {
            return object._query.apply(object, args);
          }
        ).then(
          undefined,
          function(error) {
            return object.resolve.apply(object, ['rescueQuery'].concat(args)).then(
              undefined,
              function() {
                throw error;
              }
            );
          }
        ).then(
          function(result) {
            args.unshift('didQuery');
            args.push(result);

            return object.settle.apply(object, args).then(
              function() {
                return result;
              }
            );
          },
          function(error) {
            args.unshift('didNotQuery');
            args.push(error);

            return object.settle.apply(object, args).then(
              function() {
                throw error;
              }
            );
          }
        );
      };
    }

    return object;
  }
};
