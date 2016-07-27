import { assert } from 'orbit/lib/assert';
import ActionQueue from 'orbit/action-queue';

export default class Coordinator {
  constructor() {
    this.sources = {};
    this.nodes = {};

    this.requestQueues = {};
    this.syncQueues = {};
  }

  addNode(name, options = {}) {
    assert(`Node '${name}' already exists.`, !this.nodes[name]);

    options.sourceOptions = options.sourceOptions || {};

    const node = {
      name,
      sources: {}
    };

    if (options.sources) {
      options.sources.forEach(source => {
        this.addSource(node, source, options.sourceOptions[source.name]);
      });
    }

    this.nodes[name] = node;

    return node;
  }

  addSource(node, source, options = {}) {
    assert(`A source named '${source.name}' has already been added to this coordinator.`, !this.sources[source.name]);
    assert(`A source named '${source.name}' has already been added to node '${node.name}'.`, !node.sources[source.name]);

    let needsRequestQueue = false;
    let needsSyncQueue = false;

    if (source._pushable && options.pushable !== false) {
      assert(`A 'pushable' source has already been defined for node '${node.name}'`, !node.pushableSource);
      node.pushableSource = source;
      needsRequestQueue = true;
    }

    if (source._pullable && options.pullable !== false) {
      assert(`A 'pullable' source has already been defined for node '${node.name}'`, !node.pullableSource);
      node.pullableSource = source;
      needsRequestQueue = true;
    }

    if (source._updatable && options.updatable !== false) {
      assert(`An 'updatable' source has already been defined for node '${node.name}'`, !node.updatableSource);
      node.updatableSource = source;
      needsRequestQueue = true;
    }

    if (source._queryable && options.queryable !== false) {
      assert(`A 'queryable' source has already been defined for node '${node.name}'`, !node.queryableSource);
      node.queryableSource = source;
      needsRequestQueue = true;
    }

    if (source._transformable && options.transformable !== false) {
      assert(`A 'transformable' source has already been defined for node '${node.name}'`, !node.transformableSource);
      node.transformableSource = source;
      needsSyncQueue = true;
    }

    node.sources[source.name] = source;

    this.sources[source.name] = source;

    if (needsRequestQueue) {
      this.requestQueues[source.name] = new ActionQueue();
    }

    if (needsSyncQueue) {
      this.syncQueues[source.name] = new ActionQueue();
    }
  }

  sourceForRequestEvent(node, event) {
    switch (event) {
      case 'beforeUpdate':
      case 'update':
        return node.updatableSource;

      case 'beforeQuery':
      case 'query':
        return node.queryableSource;

      case 'beforePush':
      case 'push':
        return node.pushableSource;

      case 'beforePull':
      case 'pull':
        return node.pullableSource;
    }
  }

  sourceForRequest(node, request) {
    switch (request) {
      case 'push':
        return node.pushableSource;

      case 'pull':
        return node.pullableSource;
    }
  }

  queueRequest(source, requestMethod, requestData) {
    const queue = this.requestQueues[source.name];

    const action = queue.push({
      data: requestData,
      process: () => {
        return source[requestMethod](requestData);
      }
    });

    return action.complete;
  }

  queueTransform(source, transform) {
    const queue = this.syncQueues[source.name];

    const action = queue.push({
      data: transform,
      process: () => {
        return source.transform(transform);
      }
    });

    return action.complete;
  }
}
