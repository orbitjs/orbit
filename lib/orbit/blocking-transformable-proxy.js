import Orbit from 'orbit/main';
import {
  Class,
  expose
} from 'orbit/lib/objects';
import Evented from 'orbit/evented';
import ActionQueue from './action-queue';
import Transform from './transform';

export default Class.extend({
  init(source) {
    Evented.extend(this);
    this.id = `blocking:${source.id}`;

    this._transformQueue = new ActionQueue();
    this._transformedQueue = new ActionQueue();

    this._source = source;
    this._source.on('transform', transform => this.emit('transform', transform));

    expose(this, this._source, 'query', 'liveQuery', 'cache', 'schema');
  },

  transform(transformOrOperations) {
    const transform = Transform.from(transformOrOperations);
    console.log(`${this.id}:transform`, transform.id);
    if (this._source.contains(transform)) { return; }

    return this._queueTransform(transform);
  },

  settleTransforms() {
    // console.log(`${this.id}:settleTransforms`);
    return this._transformQueue.process();
  },

  _queueTransform(transform) {
    console.log(`${this.id}:queue`, transform.id);

    let action = this._transformQueue.push({
      process: () =>
        Orbit.Promise
          .resolve(this._source.transform(transform))
          .tap(() => console.log(`${this.id}:process`, transform.id))
          .then(() => this._transformedQueue.process())
    });

    return action.complete;
  },

  _queueTransformed(transform) {
    console.log(`${this.id}:queueTransformed`, transform.id);

    let action = this._transformedQueue.push({
      process: () => this.settle('transform', transform)
    });

    return action.complete;
  }
});
