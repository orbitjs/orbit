export { default, StoreSettings, StoreMergeOptions } from './store';
export { default as Cache, CacheSettings } from './cache';

// LEGACY EXPORTS
export {
  SyncOperationProcessorClass as OperationProcessorClass,
  SyncOperationProcessor as OperationProcessor,
  SyncCacheIntegrityProcessor as CacheIntegrityProcessor,
  SyncSchemaConsistencyProcessor as SchemaConsistencyProcessor,
  SyncSchemaValidationProcessor as SchemaValidationProcessor
} from '@orbit/record-cache';
