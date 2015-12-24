import { QueryProcessorNotFoundException } from './lib/exceptions';

export default {
  init() {
    this._super(...arguments);
    this.queryProcessors = this.queryProcessors || [];
  },

  registerQueryProcessor(type, process) {
    this.queryProcessors.push({
      type,
      process
    });
  },

  unregisterQueryProcessor(type) {
    for (let i = 0; i < this.queryProcessors.length; i++) {
      if (this.queryProcessors[i].type === type) {
        this.queryProcessors.splice(i, 1);
        return;
      }
    }
  },

  processQuery(query, variant) {
    for (let processor of this.queryProcessors) {
      const [processorType, processorVariant] = processor.type.split(':');

      if (variant === processorVariant && query[processorType] !== undefined) {
        return processor.process(query[processorType]);
      }
    }

    throw new QueryProcessorNotFoundException(query);
  }
};
