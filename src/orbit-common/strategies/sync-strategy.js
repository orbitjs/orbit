export default class SyncStrategy {
  constructor({ coordinator, sourceNode, targetNode, blocking, autoActivate }) {
    this.coordinator = coordinator;
    this.sourceNode = coordinator.nodes[sourceNode];
    this.targetNode = coordinator.nodes[targetNode];
    this.blocking = blocking;

    if (autoActivate || autoActivate === undefined) {
      this.activate();
    }
  }

  activate() {
    const { sourceNode, targetNode } = this;
    const target = targetNode.transformableSource;

    this.eventListeners = {};

    Object.keys(sourceNode.sources).forEach(name => {
      const source = sourceNode.sources[name];

      const listener = (transform) => {
        const promise = this.coordinator.queueTransform(target, transform);

        if (this.blocking) {
          return promise;
        }
      };

      source.on('transform', listener);

      this.eventListeners[name] = listener;
    });
  }

  deactivate() {
    const { sourceNode, eventListeners } = this;

    if (eventListeners) {
      Object.keys(eventListeners).forEach(name => {
        const source = sourceNode.sources[name];
        const listener = eventListeners[name];

        source.off('transform', listener);
      });

      delete this.eventListeners;
    }
  }
}
