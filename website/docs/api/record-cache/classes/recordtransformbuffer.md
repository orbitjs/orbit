---
id: "RecordTransformBuffer"
title: "Class: RecordTransformBuffer"
sidebar_label: "RecordTransformBuffer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`SyncRecordCache`](SyncRecordCache.md)

  ↳ **`RecordTransformBuffer`**

## Constructors

### constructor

• **new RecordTransformBuffer**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`SyncRecordCacheSettings`](../interfaces/SyncRecordCacheSettings.md)<[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md), [`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md), `RecordQueryBuilder`<`string`, `RecordIdentity`\>, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[constructor](SyncRecordCache.md#constructor)

#### Defined in

[record-cache/src/record-transform-buffer.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L37)

## Accessors

### defaultQueryOptions

• `get` **defaultQueryOptions**(): `undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Defined in

[record-cache/src/record-cache.ts:166](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L166)

• `set` **defaultQueryOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`QueryOptions`\> |

#### Returns

`void`

#### Defined in

[record-cache/src/record-cache.ts:170](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L170)

___

### defaultTransformOptions

• `get` **defaultTransformOptions**(): `undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Defined in

[record-cache/src/record-cache.ts:176](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L176)

• `set` **defaultTransformOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`TransformOptions`\> |

#### Returns

`void`

#### Defined in

[record-cache/src/record-cache.ts:182](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L182)

___

### keyMap

• `get` **keyMap**(): `undefined` \| `RecordKeyMap`

#### Returns

`undefined` \| `RecordKeyMap`

#### Defined in

[record-cache/src/record-cache.ts:148](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L148)

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[record-cache/src/record-cache.ts:140](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L140)

___

### processors

• `get` **processors**(): [`SyncOperationProcessor`](SyncOperationProcessor.md)[]

#### Returns

[`SyncOperationProcessor`](SyncOperationProcessor.md)[]

#### Defined in

[record-cache/src/sync-record-cache.ts:136](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L136)

___

### queryBuilder

• `get` **queryBuilder**(): `QueryBuilder`

#### Returns

`QueryBuilder`

#### Defined in

[record-cache/src/record-cache.ts:158](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L158)

___

### schema

• `get` **schema**(): `RecordSchema`

#### Returns

`RecordSchema`

#### Defined in

[record-cache/src/record-cache.ts:144](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L144)

___

### transformBuilder

• `get` **transformBuilder**(): `TransformBuilder`

#### Returns

`TransformBuilder`

#### Defined in

[record-cache/src/record-cache.ts:162](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L162)

___

### validatorFor

• `get` **validatorFor**(): `undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Returns

`undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Defined in

[record-cache/src/record-cache.ts:152](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L152)

## Methods

### addInverseRelationshipsSync

▸ **addInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[] |

#### Returns

`void`

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[addInverseRelationshipsSync](SyncRecordCache.md#addinverserelationshipssync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:192](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L192)

___

### applyRecordChangesetSync

▸ **applyRecordChangesetSync**(`changeset`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `changeset` | [`RecordChangeset`](../interfaces/RecordChangeset.md) |

#### Returns

`void`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[applyRecordChangesetSync](SyncRecordCache.md#applyrecordchangesetsync)

#### Defined in

[record-cache/src/sync-record-cache.ts:179](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L179)

___

### emit

▸ **emit**(`event`, ...`args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `...args` | `unknown`[] |

#### Returns

`void`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[emit](SyncRecordCache.md#emit)

#### Defined in

core/dist/modules/evented.d.ts:23

___

### getInverseRelationshipsSync

▸ **getInverseRelationshipsSync**(`recordIdentityOrIdentities`): [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentityOrIdentities` | `RecordIdentity` \| `RecordIdentity`[] |

#### Returns

[`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[]

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[getInverseRelationshipsSync](SyncRecordCache.md#getinverserelationshipssync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:175](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L175)

___

### getInverseTransformOperator

▸ **getInverseTransformOperator**(`op`): [`SyncInverseTransformOperator`](../interfaces/SyncInverseTransformOperator.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

[`SyncInverseTransformOperator`](../interfaces/SyncInverseTransformOperator.md)

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[getInverseTransformOperator](SyncRecordCache.md#getinversetransformoperator)

#### Defined in

[record-cache/src/sync-record-cache.ts:148](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L148)

___

### getQueryOperator

▸ **getQueryOperator**(`op`): [`SyncQueryOperator`](../interfaces/SyncQueryOperator.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

[`SyncQueryOperator`](../interfaces/SyncQueryOperator.md)

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[getQueryOperator](SyncRecordCache.md#getqueryoperator)

#### Defined in

[record-cache/src/sync-record-cache.ts:140](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L140)

___

### getQueryOptions

▸ **getQueryOptions**(`query`, `expression?`): `undefined` \| [`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `RecordQuery` |
| `expression?` | `FindRecord` \| `FindRelatedRecord` \| `FindRelatedRecords` \| `FindRecords` |

#### Returns

`undefined` \| [`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md)

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[getQueryOptions](SyncRecordCache.md#getqueryoptions)

#### Defined in

[record-cache/src/record-cache.ts:188](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L188)

___

### getRecordSync

▸ **getRecordSync**(`identity`): `RecordOperationResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |

#### Returns

`RecordOperationResult`<`InitializedRecord`\>

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[getRecordSync](SyncRecordCache.md#getrecordsync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:110](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L110)

___

### getRecordsSync

▸ **getRecordsSync**(`typeOrIdentities?`): `InitializedRecord`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeOrIdentities?` | `string` \| `RecordIdentity`[] |

#### Returns

`InitializedRecord`[]

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[getRecordsSync](SyncRecordCache.md#getrecordssync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:114](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L114)

___

### getRelatedRecordSync

▸ **getRelatedRecordSync**(`identity`, `relationship`): `undefined` \| ``null`` \| `RecordIdentity`

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`undefined` \| ``null`` \| `RecordIdentity`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[getRelatedRecordSync](SyncRecordCache.md#getrelatedrecordsync)

#### Defined in

[record-cache/src/sync-record-cache.ts:201](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L201)

___

### getRelatedRecordsSync

▸ **getRelatedRecordsSync**(`identity`, `relationship`): `undefined` \| `RecordIdentity`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`undefined` \| `RecordIdentity`[]

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[getRelatedRecordsSync](SyncRecordCache.md#getrelatedrecordssync)

#### Defined in

[record-cache/src/sync-record-cache.ts:212](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L212)

___

### getTransformOperator

▸ **getTransformOperator**(`op`): [`SyncTransformOperator`](../interfaces/SyncTransformOperator.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

[`SyncTransformOperator`](../interfaces/SyncTransformOperator.md)

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[getTransformOperator](SyncRecordCache.md#gettransformoperator)

#### Defined in

[record-cache/src/sync-record-cache.ts:144](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L144)

___

### getTransformOptions

▸ **getTransformOptions**(`transform`, `operation?`): `undefined` \| [`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `RecordTransform` |
| `operation?` | `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation` |

#### Returns

`undefined` \| [`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md)

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[getTransformOptions](SyncRecordCache.md#gettransformoptions)

#### Defined in

[record-cache/src/record-cache.ts:202](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L202)

___

### listeners

▸ **listeners**(`event`): `Listener`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |

#### Returns

`Listener`[]

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[listeners](SyncRecordCache.md#listeners)

#### Defined in

core/dist/modules/evented.d.ts:24

___

### liveQuery

▸ **liveQuery**(`queryOrExpressions`, `options?`, `id?`): [`SyncLiveQuery`](SyncLiveQuery.md)<[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md), [`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md), `RecordQueryBuilder`<`string`, `RecordIdentity`\>, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>\> |
| `options?` | `DefaultRequestOptions`<[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md)\> |
| `id?` | `string` |

#### Returns

[`SyncLiveQuery`](SyncLiveQuery.md)<[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md), [`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md), `RecordQueryBuilder`<`string`, `RecordIdentity`\>, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\>

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[liveQuery](SyncRecordCache.md#livequery)

#### Defined in

[record-cache/src/sync-record-cache.ts:324](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L324)

___

### off

▸ **off**(`event`, `listener?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener?` | `Listener` |

#### Returns

`void`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[off](SyncRecordCache.md#off)

#### Defined in

core/dist/modules/evented.d.ts:21

___

### on

▸ **on**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | `Listener` |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[on](SyncRecordCache.md#on)

#### Defined in

core/dist/modules/evented.d.ts:20

___

### one

▸ **one**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | `Listener` |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[one](SyncRecordCache.md#one)

#### Defined in

core/dist/modules/evented.d.ts:22

___

### patch

▸ **patch**(`operationOrOperations`): [`PatchResult`](../interfaces/PatchResult.md)

Patches the cache with an operation or operations.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `operationOrOperations` | `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation` \| `RecordOperation`[] \| `AddRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `UpdateRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceKeyTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceAttributeTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `AddToRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveFromRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RecordOperationTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\>[] \| `TransformBuilderFunc`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |

#### Returns

[`PatchResult`](../interfaces/PatchResult.md)

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[patch](SyncRecordCache.md#patch)

#### Defined in

[record-cache/src/sync-record-cache.ts:300](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L300)

___

### query

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options?`, `id?`): `RequestData`

Queries the cache.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>\> |
| `options?` | `DefaultRequestOptions`<[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md)\> |
| `id?` | `string` |

#### Returns

`RequestData`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[query](SyncRecordCache.md#query)

#### Defined in

[record-cache/src/sync-record-cache.ts:226](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L226)

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options`, `id?`): `FullResponse`<`RequestData`, `unknown`, `RecordOperation`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>\> |
| `options` | `FullRequestOptions`<[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md)\> |
| `id?` | `string` |

#### Returns

`FullResponse`<`RequestData`, `unknown`, `RecordOperation`\>

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[query](SyncRecordCache.md#query)

#### Defined in

[record-cache/src/sync-record-cache.ts:231](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L231)

___

### removeInverseRelationshipsSync

▸ **removeInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[] |

#### Returns

`void`

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[removeInverseRelationshipsSync](SyncRecordCache.md#removeinverserelationshipssync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:211](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L211)

___

### removeRecordSync

▸ **removeRecordSync**(`recordIdentity`): `RecordOperationResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`RecordOperationResult`<`InitializedRecord`\>

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[removeRecordSync](SyncRecordCache.md#removerecordsync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:145](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L145)

___

### removeRecordsSync

▸ **removeRecordsSync**(`recordIdentities`): `InitializedRecord`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentities` | `RecordIdentity`[] |

#### Returns

`InitializedRecord`[]

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[removeRecordsSync](SyncRecordCache.md#removerecordssync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:160](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L160)

___

### reset

▸ **reset**(`state?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`RecordTransformBufferState`](../interfaces/RecordTransformBufferState.md) |

#### Returns

`void`

#### Defined in

[record-cache/src/record-transform-buffer.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L42)

___

### setRecordSync

▸ **setRecordSync**(`record`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

`void`

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[setRecordSync](SyncRecordCache.md#setrecordsync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:134](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L134)

___

### setRecordsSync

▸ **setRecordsSync**(`records`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `InitializedRecord`[] |

#### Returns

`void`

#### Overrides

[SyncRecordCache](SyncRecordCache.md).[setRecordsSync](SyncRecordCache.md#setrecordssync)

#### Defined in

[record-cache/src/record-transform-buffer.ts:141](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L141)

___

### startTrackingChanges

▸ **startTrackingChanges**(): `void`

#### Returns

`void`

#### Defined in

[record-cache/src/record-transform-buffer.ts:51](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L51)

___

### stopTrackingChanges

▸ **stopTrackingChanges**(): [`RecordChangeset`](../interfaces/RecordChangeset.md)

#### Returns

[`RecordChangeset`](../interfaces/RecordChangeset.md)

#### Defined in

[record-cache/src/record-transform-buffer.ts:58](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-transform-buffer.ts#L58)

___

### update

▸ **update**<`RequestData`\>(`transformOrOperations`, `options?`, `id?`): `RequestData`

Updates the cache.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |
| `options?` | `DefaultRequestOptions`<[`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md)\> |
| `id?` | `string` |

#### Returns

`RequestData`

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[update](SyncRecordCache.md#update)

#### Defined in

[record-cache/src/sync-record-cache.ts:262](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L262)

▸ **update**<`RequestData`\>(`transformOrOperations`, `options`, `id?`): `FullResponse`<`RequestData`, [`RecordCacheUpdateDetails`](../interfaces/RecordCacheUpdateDetails.md), `RecordOperation`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |
| `options` | `FullRequestOptions`<[`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md)\> |
| `id?` | `string` |

#### Returns

`FullResponse`<`RequestData`, [`RecordCacheUpdateDetails`](../interfaces/RecordCacheUpdateDetails.md), `RecordOperation`\>

#### Inherited from

[SyncRecordCache](SyncRecordCache.md).[update](SyncRecordCache.md#update)

#### Defined in

[record-cache/src/sync-record-cache.ts:267](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L267)
