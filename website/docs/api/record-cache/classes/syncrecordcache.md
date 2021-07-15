---
id: "SyncRecordCache"
title: "Class: SyncRecordCache<QO, TO, QB, TB, QueryResponseDetails, TransformResponseDetails>"
sidebar_label: "SyncRecordCache"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md) |
| `TO` | extends `RequestOptions`[`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md) |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |
| `QueryResponseDetails` | `unknown` |
| `TransformResponseDetails` | extends [`RecordCacheUpdateDetails`](../interfaces/RecordCacheUpdateDetails.md)[`RecordCacheUpdateDetails`](../interfaces/RecordCacheUpdateDetails.md) |

## Hierarchy

- [`RecordCache`](RecordCache.md)<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`SyncRecordCache`**

  ↳↳ [`RecordTransformBuffer`](RecordTransformBuffer.md)

## Implements

- [`SyncRecordAccessor`](../interfaces/SyncRecordAccessor.md)
- `SyncRecordQueryable`<`QueryResponseDetails`, `QB`, `QO`\>
- `SyncRecordUpdatable`<`TransformResponseDetails`, `TB`, `TO`\>

## Constructors

### constructor

• **new SyncRecordCache**<`QO`, `TO`, `QB`, `TB`, `QueryResponseDetails`, `TransformResponseDetails`\>(`settings`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md) |
| `TO` | extends `RequestOptions`[`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md) |
| `QB` | `RecordQueryBuilder`<`string`, `RecordIdentity`\> |
| `TB` | `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\> |
| `QueryResponseDetails` | `unknown` |
| `TransformResponseDetails` | extends [`RecordCacheUpdateDetails`](../interfaces/RecordCacheUpdateDetails.md)[`RecordCacheUpdateDetails`](../interfaces/RecordCacheUpdateDetails.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`SyncRecordCacheSettings`](../interfaces/SyncRecordCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Overrides

[RecordCache](RecordCache.md).[constructor](RecordCache.md#constructor)

#### Defined in

[record-cache/src/sync-record-cache.ts:108](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L108)

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

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[keyMap](../interfaces/SyncRecordAccessor.md#keymap)

#### Defined in

[record-cache/src/record-cache.ts:148](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L148)

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[name](../interfaces/SyncRecordAccessor.md#name)

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

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[schema](../interfaces/SyncRecordAccessor.md#schema)

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

▸ `Abstract` **addInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[] |

#### Returns

`void`

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[addInverseRelationshipsSync](../interfaces/SyncRecordAccessor.md#addinverserelationshipssync)

#### Defined in

[record-cache/src/sync-record-cache.ts:172](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L172)

___

### applyRecordChangesetSync

▸ **applyRecordChangesetSync**(`changeset`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `changeset` | [`RecordChangeset`](../interfaces/RecordChangeset.md) |

#### Returns

`void`

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[applyRecordChangesetSync](../interfaces/SyncRecordAccessor.md#applyrecordchangesetsync)

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

[RecordCache](RecordCache.md).[emit](RecordCache.md#emit)

#### Defined in

core/dist/modules/evented.d.ts:23

___

### getInverseRelationshipsSync

▸ `Abstract` **getInverseRelationshipsSync**(`recordIdentityOrIdentities`): [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentityOrIdentities` | `RecordIdentity` \| `RecordIdentity`[] |

#### Returns

[`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[]

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[getInverseRelationshipsSync](../interfaces/SyncRecordAccessor.md#getinverserelationshipssync)

#### Defined in

[record-cache/src/sync-record-cache.ts:159](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L159)

___

### getInverseTransformOperator

▸ **getInverseTransformOperator**(`op`): [`SyncInverseTransformOperator`](../interfaces/SyncInverseTransformOperator.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

[`SyncInverseTransformOperator`](../interfaces/SyncInverseTransformOperator.md)

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

#### Defined in

[record-cache/src/sync-record-cache.ts:140](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L140)

___

### getQueryOptions

▸ **getQueryOptions**(`query`, `expression?`): `undefined` \| `QO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `RecordQuery` |
| `expression?` | `FindRecord` \| `FindRelatedRecord` \| `FindRelatedRecords` \| `FindRecords` |

#### Returns

`undefined` \| `QO`

#### Inherited from

[RecordCache](RecordCache.md).[getQueryOptions](RecordCache.md#getqueryoptions)

#### Defined in

[record-cache/src/record-cache.ts:188](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L188)

___

### getRecordSync

▸ `Abstract` **getRecordSync**(`recordIdentity`): `RecordOperationResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`RecordOperationResult`<`InitializedRecord`\>

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[getRecordSync](../interfaces/SyncRecordAccessor.md#getrecordsync)

#### Defined in

[record-cache/src/sync-record-cache.ts:153](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L153)

___

### getRecordsSync

▸ `Abstract` **getRecordsSync**(`typeOrIdentities?`): `InitializedRecord`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeOrIdentities?` | `string` \| `RecordIdentity`[] |

#### Returns

`InitializedRecord`[]

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[getRecordsSync](../interfaces/SyncRecordAccessor.md#getrecordssync)

#### Defined in

[record-cache/src/sync-record-cache.ts:156](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L156)

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

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[getRelatedRecordSync](../interfaces/SyncRecordAccessor.md#getrelatedrecordsync)

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

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[getRelatedRecordsSync](../interfaces/SyncRecordAccessor.md#getrelatedrecordssync)

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

#### Defined in

[record-cache/src/sync-record-cache.ts:144](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L144)

___

### getTransformOptions

▸ **getTransformOptions**(`transform`, `operation?`): `undefined` \| `TO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `RecordTransform` |
| `operation?` | `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation` |

#### Returns

`undefined` \| `TO`

#### Inherited from

[RecordCache](RecordCache.md).[getTransformOptions](RecordCache.md#gettransformoptions)

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

[RecordCache](RecordCache.md).[listeners](RecordCache.md#listeners)

#### Defined in

core/dist/modules/evented.d.ts:24

___

### liveQuery

▸ **liveQuery**(`queryOrExpressions`, `options?`, `id?`): [`SyncLiveQuery`](SyncLiveQuery.md)<`QO`, `TO`, `QB`, `TB`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options?` | `DefaultRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

[`SyncLiveQuery`](SyncLiveQuery.md)<`QO`, `TO`, `QB`, `TB`\>

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

[RecordCache](RecordCache.md).[off](RecordCache.md#off)

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

[RecordCache](RecordCache.md).[on](RecordCache.md#on)

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

[RecordCache](RecordCache.md).[one](RecordCache.md#one)

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
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options?` | `DefaultRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

`RequestData`

#### Implementation of

SyncRecordQueryable.query

#### Defined in

[record-cache/src/sync-record-cache.ts:226](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L226)

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options`, `id?`): `FullResponse`<`RequestData`, `QueryResponseDetails`, `RecordOperation`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options` | `FullRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

`FullResponse`<`RequestData`, `QueryResponseDetails`, `RecordOperation`\>

#### Implementation of

SyncRecordQueryable.query

#### Defined in

[record-cache/src/sync-record-cache.ts:231](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L231)

___

### removeInverseRelationshipsSync

▸ `Abstract` **removeInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[] |

#### Returns

`void`

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[removeInverseRelationshipsSync](../interfaces/SyncRecordAccessor.md#removeinverserelationshipssync)

#### Defined in

[record-cache/src/sync-record-cache.ts:175](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L175)

___

### removeRecordSync

▸ `Abstract` **removeRecordSync**(`recordIdentity`): `RecordOperationResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`RecordOperationResult`<`InitializedRecord`\>

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[removeRecordSync](../interfaces/SyncRecordAccessor.md#removerecordsync)

#### Defined in

[record-cache/src/sync-record-cache.ts:166](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L166)

___

### removeRecordsSync

▸ `Abstract` **removeRecordsSync**(`recordIdentities`): `InitializedRecord`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentities` | `RecordIdentity`[] |

#### Returns

`InitializedRecord`[]

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[removeRecordsSync](../interfaces/SyncRecordAccessor.md#removerecordssync)

#### Defined in

[record-cache/src/sync-record-cache.ts:169](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L169)

___

### setRecordSync

▸ `Abstract` **setRecordSync**(`record`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

`void`

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[setRecordSync](../interfaces/SyncRecordAccessor.md#setrecordsync)

#### Defined in

[record-cache/src/sync-record-cache.ts:164](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L164)

___

### setRecordsSync

▸ `Abstract` **setRecordsSync**(`records`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `InitializedRecord`[] |

#### Returns

`void`

#### Implementation of

[SyncRecordAccessor](../interfaces/SyncRecordAccessor.md).[setRecordsSync](../interfaces/SyncRecordAccessor.md#setrecordssync)

#### Defined in

[record-cache/src/sync-record-cache.ts:165](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L165)

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
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `TB`\> |
| `options?` | `DefaultRequestOptions`<`TO`\> |
| `id?` | `string` |

#### Returns

`RequestData`

#### Implementation of

SyncRecordUpdatable.update

#### Defined in

[record-cache/src/sync-record-cache.ts:262](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L262)

▸ **update**<`RequestData`\>(`transformOrOperations`, `options`, `id?`): `FullResponse`<`RequestData`, `TransformResponseDetails`, `RecordOperation`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `TB`\> |
| `options` | `FullRequestOptions`<`TO`\> |
| `id?` | `string` |

#### Returns

`FullResponse`<`RequestData`, `TransformResponseDetails`, `RecordOperation`\>

#### Implementation of

SyncRecordUpdatable.update

#### Defined in

[record-cache/src/sync-record-cache.ts:267](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-record-cache.ts#L267)
