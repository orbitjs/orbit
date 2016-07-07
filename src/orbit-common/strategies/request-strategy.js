import Orbit from 'orbit/main';

export default class RequestStrategy {
  constructor({ coordinator, sourceNode, targetNode, sourceEvent, targetRequest, syncResults, blocking, autoActivate }) {
    this.coordinator = coordinator;
    this.sourceNode = coordinator.nodes[sourceNode];
    this.targetNode = coordinator.nodes[targetNode];
    this.sourceEvent = sourceEvent;
    this.targetRequest = targetRequest;
    this.syncResults = syncResults;
    this.blocking = blocking;

    this.source = coordinator.sourceForEvent(this.sourceNode, sourceEvent);
    this.target = coordinator.sourceForRequest(this.targetNode, targetRequest);

    if (autoActivate || autoActivate === undefined) {
      this.activate();
    }
  }

  activate() {
    const { coordinator, source, target, sourceEvent, targetRequest, syncResults, blocking } = this;

    const eventListener = (request) => {
      const promise = coordinator.queueRequest(target, targetRequest, request)
        .then(result => {
          if (result && syncResults) {
            return result.reduce((chain, t) => {
              return chain.then(() => coordinator.queueTransform(source, t));
            }, Orbit.Promise.resolve());
          }
        });

      if (blocking) {
        return promise;
      }
    };

    source.on(sourceEvent, eventListener);

    this.eventListener = eventListener;
  }

  deactivate() {
    const { source, sourceEvent, eventListener } = this;

    if (eventListener) {
      source.off(sourceEvent, eventListener);
      delete this.eventListener;
    }
  }
}
