import Orbit from './main';
import Evented from './evented';

export default {
  init() {
    this._super(...arguments);

    Evented.extend(this);
  },

  query() {
    const args = Array.prototype.slice.call(arguments, 0);

    return this.resolve.apply(this, ['assistQuery'].concat(args))
      .then(
        undefined,
        () => {
          const result = this._query.apply(this, args);
          if (result.then) {
            return result;
          } else {
            return Orbit.Promise.resolve(result);
          }
        }
      )
      .then(
        undefined,
        (error) => {
          return this.resolve.apply(this, ['rescueQuery'].concat(args)).then(
            undefined,
            function() {
              throw error;
            }
          );
        }
      )
      .then(
        (result) => {
          args.unshift('querySucceeded');
          args.push(result);

          return this.settle.apply(this, args).then(
            function() {
              return result;
            }
          );
        },
        (error) => {
          args.unshift('queryFailed');
          args.push(error);

          return this.settle.apply(this, args).then(
            function() {
              throw error;
            }
          );
        }
      );
  }
};
