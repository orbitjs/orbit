export {
  default,
  MemorySourceSettings,
  MemorySourceMergeOptions
} from './memory-source';
export { default as MemoryCache, MemoryCacheSettings } from './memory-cache';

// LEGACY EXPORTS
export {
  SyncOperationProcessorClass as OperationProcessorClass,
  SyncOperationProcessor as OperationProcessor,
  SyncCacheIntegrityProcessor as CacheIntegrityProcessor,
  SyncSchemaConsistencyProcessor as SchemaConsistencyProcessor,
  SyncSchemaValidationProcessor as SchemaValidationProcessor
} from '@orbit/record-cache';
