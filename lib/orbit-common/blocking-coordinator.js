import Orbit from 'orbit/main';
import { Class } from 'orbit/lib/objects';
import Cache from 'orbit-common/cache';
import 'orbit-common/rxjs/operators/map-concurrently';
import 'orbit-common/rxjs/operators/map-sequentially';
import TransformTracker from 'orbit-common/coordinators/transform-tracker';

export default Class.extend({
  init(opts) {
    this.schema = opts.schema;
    this.cache = new Cache(opts.schema);

    this._source = opts.source;
    this._pipeline = this._buildPipeline();
    this._transformTracker = new TransformTracker();

    this._source.on('transform', transform => this.cache.transform(transform));
    this.cache.on('transform', transform => this._transformTracker.confirm(transform));
  },

  transform(transform) {
    const onConfirmation = this._transformTracker.onConfirmation(transform);

    this._pipeline.onNext(transform);

    return onConfirmation;
  },

  query(query) {
    return Orbit.Promise.resolve(this.cache.query(query));
  },

  _buildPipeline() {
    const pipeline = new Rx.Subject();

    pipeline
      .mapSequentially(transform => {
        return this._source.transform(transform).then(() => transform);
      })
      .subscribe();

    return pipeline;
  }
});
