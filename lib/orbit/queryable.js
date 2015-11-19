import Orbit from './main';
import Evented from './evented';

export default {
  init() {
    this._super(...arguments);

    Evented.extend(this);
  },

  query() {
    const args = Array.prototype.slice.call(arguments, 0);

    return this.series.apply(this, ['beforeQuery'].concat(args))
      .then(
        () => {
          let result = this._query.apply(this, args);
          if (result && result.then) {
            return result;
          } else {
            return Orbit.Promise.resolve(result);
          }
        }
      )
      .then(
        (result) => {
          args.unshift('query');
          args.push(result);

          return this.settle.apply(this, args).then(
            function() {
              return result;
            }
          );
        },
        (error) => {
          args.unshift('queryFail');
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
