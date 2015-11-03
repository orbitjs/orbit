import { QueryProcessorNotFoundException } from './lib/exceptions';

export default {
  init() {
    this.queryProcessors = this.queryProcessors || [];
  },

  registerQueryProcessor(type, process) {
    this.queryProcessors.push({
      type,
      process,
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

  processQuery(query) {
    for (let processor of this.queryProcessors) {
      if (query[processor.type] !== undefined) {
        return processor.process(query[processor.type]);
      }
    }

    throw new QueryProcessorNotFoundException(query);
  }
};
