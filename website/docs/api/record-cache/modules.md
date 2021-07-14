---
id: "modules"
title: "@orbit/record-cache"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Classes

- [AsyncCacheIntegrityProcessor](classes/AsyncCacheIntegrityProcessor.md)
- [AsyncLiveQuery](classes/AsyncLiveQuery.md)
- [AsyncLiveQueryUpdate](classes/AsyncLiveQueryUpdate.md)
- [AsyncOperationProcessor](classes/AsyncOperationProcessor.md)
- [AsyncRecordCache](classes/AsyncRecordCache.md)
- [AsyncSchemaConsistencyProcessor](classes/AsyncSchemaConsistencyProcessor.md)
- [AsyncSchemaValidationProcessor](classes/AsyncSchemaValidationProcessor.md)
- [RecordCache](classes/RecordCache.md)
- [RecordTransformBuffer](classes/RecordTransformBuffer.md)
- [SyncCacheIntegrityProcessor](classes/SyncCacheIntegrityProcessor.md)
- [SyncLiveQuery](classes/SyncLiveQuery.md)
- [SyncLiveQueryUpdate](classes/SyncLiveQueryUpdate.md)
- [SyncOperationProcessor](classes/SyncOperationProcessor.md)
- [SyncRecordCache](classes/SyncRecordCache.md)
- [SyncSchemaConsistencyProcessor](classes/SyncSchemaConsistencyProcessor.md)
- [SyncSchemaValidationProcessor](classes/SyncSchemaValidationProcessor.md)

## Interfaces

- [AsyncInverseTransformOperator](interfaces/AsyncInverseTransformOperator.md)
- [AsyncLiveQuerySettings](interfaces/AsyncLiveQuerySettings.md)
- [AsyncLiveQueryUpdateSettings](interfaces/AsyncLiveQueryUpdateSettings.md)
- [AsyncOperationProcessorClass](interfaces/AsyncOperationProcessorClass.md)
- [AsyncQueryOperator](interfaces/AsyncQueryOperator.md)
- [AsyncRecordAccessor](interfaces/AsyncRecordAccessor.md)
- [AsyncRecordCacheSettings](interfaces/AsyncRecordCacheSettings.md)
- [AsyncTransformOperator](interfaces/AsyncTransformOperator.md)
- [BaseRecordAccessor](interfaces/BaseRecordAccessor.md)
- [PatchResult](interfaces/PatchResult.md)
- [RecordCacheQueryOptions](interfaces/RecordCacheQueryOptions.md)
- [RecordCacheSettings](interfaces/RecordCacheSettings.md)
- [RecordCacheTransformOptions](interfaces/RecordCacheTransformOptions.md)
- [RecordCacheUpdateDetails](interfaces/RecordCacheUpdateDetails.md)
- [RecordChangeset](interfaces/RecordChangeset.md)
- [RecordRelationshipIdentity](interfaces/RecordRelationshipIdentity.md)
- [RecordTransformBufferClass](interfaces/RecordTransformBufferClass.md)
- [RecordTransformBufferState](interfaces/RecordTransformBufferState.md)
- [RelatedRecordIdentity](interfaces/RelatedRecordIdentity.md)
- [SyncInverseTransformOperator](interfaces/SyncInverseTransformOperator.md)
- [SyncLiveQuerySettings](interfaces/SyncLiveQuerySettings.md)
- [SyncLiveQueryUpdateSettings](interfaces/SyncLiveQueryUpdateSettings.md)
- [SyncOperationProcessorClass](interfaces/SyncOperationProcessorClass.md)
- [SyncQueryOperator](interfaces/SyncQueryOperator.md)
- [SyncRecordAccessor](interfaces/SyncRecordAccessor.md)
- [SyncRecordCacheSettings](interfaces/SyncRecordCacheSettings.md)
- [SyncTransformOperator](interfaces/SyncTransformOperator.md)

## Variables

### AsyncInverseTransformOperators

• `Const` **AsyncInverseTransformOperators**: `Dict`<[`AsyncInverseTransformOperator`](interfaces/AsyncInverseTransformOperator.md)\>

#### Defined in

[record-cache/src/operators/async-inverse-transform-operators.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/async-inverse-transform-operators.ts#L31)

___

### AsyncQueryOperators

• `Const` **AsyncQueryOperators**: `Dict`<[`AsyncQueryOperator`](interfaces/AsyncQueryOperator.md)\>

#### Defined in

[record-cache/src/operators/async-query-operators.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/async-query-operators.ts#L26)

___

### AsyncTransformOperators

• `Const` **AsyncTransformOperators**: `Dict`<[`AsyncTransformOperator`](interfaces/AsyncTransformOperator.md)\>

#### Defined in

[record-cache/src/operators/async-transform-operators.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/async-transform-operators.ts#L33)

___

### SyncInverseTransformOperators

• `Const` **SyncInverseTransformOperators**: `Dict`<[`SyncInverseTransformOperator`](interfaces/SyncInverseTransformOperator.md)\>

#### Defined in

[record-cache/src/operators/sync-inverse-transform-operators.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/sync-inverse-transform-operators.ts#L31)

___

### SyncQueryOperators

• `Const` **SyncQueryOperators**: `Dict`<[`SyncQueryOperator`](interfaces/SyncQueryOperator.md)\>

#### Defined in

[record-cache/src/operators/sync-query-operators.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/sync-query-operators.ts#L26)

___

### SyncTransformOperators

• `Const` **SyncTransformOperators**: `Dict`<[`SyncTransformOperator`](interfaces/SyncTransformOperator.md)\>

#### Defined in

[record-cache/src/operators/sync-transform-operators.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/sync-transform-operators.ts#L33)
