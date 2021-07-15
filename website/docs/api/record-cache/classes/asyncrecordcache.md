---
id: "AsyncRecordCache"
title: "Class: AsyncRecordCache<QO, TO, QB, TB, QueryResponseDetails, TransformResponseDetails>"
sidebar_label: "AsyncRecordCache"
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

  ↳ **`AsyncRecordCache`**

## Implements

- [`AsyncRecordAccessor`](../interfaces/AsyncRecordAccessor.md)
- `AsyncRecordQueryable`<`QueryResponseDetails`, `QB`, `QO`\>
- `AsyncRecordUpdatable`<`TransformResponseDetails`, `TB`, `TO`\>

## Constructors

### constructor

• **new AsyncRecordCache**<`QO`, `TO`, `QB`, `TB`, `QueryResponseDetails`, `TransformResponseDetails`\>(`settings`)

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
| `settings` | [`AsyncRecordCacheSettings`](../interfaces/AsyncRecordCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Overrides

[RecordCache](RecordCache.md).[constructor](RecordCache.md#constructor)

#### Defined in

[record-cache/src/async-record-cache.ts:109](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L109)

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

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[keyMap](../interfaces/AsyncRecordAccessor.md#keymap)

#### Defined in

[record-cache/src/record-cache.ts:148](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L148)

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[name](../interfaces/AsyncRecordAccessor.md#name)

#### Defined in

[record-cache/src/record-cache.ts:140](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L140)

___

### processors

• `get` **processors**(): [`AsyncOperationProcessor`](AsyncOperationProcessor.md)[]

#### Returns

[`AsyncOperationProcessor`](AsyncOperationProcessor.md)[]

#### Defined in

[record-cache/src/async-record-cache.ts:137](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L137)

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

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[schema](../interfaces/AsyncRecordAccessor.md#schema)

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

### addInverseRelationshipsAsync

▸ `Abstract` **addInverseRelationshipsAsync**(`relationships`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[] |

#### Returns

`Promise`<`void`\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[addInverseRelationshipsAsync](../interfaces/AsyncRecordAccessor.md#addinverserelationshipsasync)

#### Defined in

[record-cache/src/async-record-cache.ts:173](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L173)

___

### applyRecordChangesetAsync

▸ **applyRecordChangesetAsync**(`changeset`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `changeset` | [`RecordChangeset`](../interfaces/RecordChangeset.md) |

#### Returns

`Promise`<`void`\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[applyRecordChangesetAsync](../interfaces/AsyncRecordAccessor.md#applyrecordchangesetasync)

#### Defined in

[record-cache/src/async-record-cache.ts:180](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L180)

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

### getInverseRelationshipsAsync

▸ `Abstract` **getInverseRelationshipsAsync**(`recordIdentityOrIdentities`): `Promise`<[`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentityOrIdentities` | `RecordIdentity` \| `RecordIdentity`[] |

#### Returns

`Promise`<[`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[]\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[getInverseRelationshipsAsync](../interfaces/AsyncRecordAccessor.md#getinverserelationshipsasync)

#### Defined in

[record-cache/src/async-record-cache.ts:160](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L160)

___

### getInverseTransformOperator

▸ **getInverseTransformOperator**(`op`): [`AsyncInverseTransformOperator`](../interfaces/AsyncInverseTransformOperator.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

[`AsyncInverseTransformOperator`](../interfaces/AsyncInverseTransformOperator.md)

#### Defined in

[record-cache/src/async-record-cache.ts:149](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L149)

___

### getQueryOperator

▸ **getQueryOperator**(`op`): [`AsyncQueryOperator`](../interfaces/AsyncQueryOperator.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

[`AsyncQueryOperator`](../interfaces/AsyncQueryOperator.md)

#### Defined in

[record-cache/src/async-record-cache.ts:141](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L141)

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

### getRecordAsync

▸ `Abstract` **getRecordAsync**(`recordIdentity`): `Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[getRecordAsync](../interfaces/AsyncRecordAccessor.md#getrecordasync)

#### Defined in

[record-cache/src/async-record-cache.ts:154](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L154)

___

### getRecordsAsync

▸ `Abstract` **getRecordsAsync**(`typeOrIdentities?`): `Promise`<`InitializedRecord`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeOrIdentities?` | `string` \| `RecordIdentity`[] |

#### Returns

`Promise`<`InitializedRecord`[]\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[getRecordsAsync](../interfaces/AsyncRecordAccessor.md#getrecordsasync)

#### Defined in

[record-cache/src/async-record-cache.ts:157](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L157)

___

### getRelatedRecordAsync

▸ **getRelatedRecordAsync**(`identity`, `relationship`): `Promise`<`undefined` \| ``null`` \| `RecordIdentity`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`Promise`<`undefined` \| ``null`` \| `RecordIdentity`\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[getRelatedRecordAsync](../interfaces/AsyncRecordAccessor.md#getrelatedrecordasync)

#### Defined in

[record-cache/src/async-record-cache.ts:210](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L210)

___

### getRelatedRecordsAsync

▸ **getRelatedRecordsAsync**(`identity`, `relationship`): `Promise`<`undefined` \| `RecordIdentity`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `RecordIdentity` |
| `relationship` | `string` |

#### Returns

`Promise`<`undefined` \| `RecordIdentity`[]\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[getRelatedRecordsAsync](../interfaces/AsyncRecordAccessor.md#getrelatedrecordsasync)

#### Defined in

[record-cache/src/async-record-cache.ts:221](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L221)

___

### getTransformOperator

▸ **getTransformOperator**(`op`): [`AsyncTransformOperator`](../interfaces/AsyncTransformOperator.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

[`AsyncTransformOperator`](../interfaces/AsyncTransformOperator.md)

#### Defined in

[record-cache/src/async-record-cache.ts:145](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L145)

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

▸ **liveQuery**(`queryOrExpressions`, `options?`, `id?`): [`AsyncLiveQuery`](AsyncLiveQuery.md)<`QO`, `TO`, `QB`, `TB`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options?` | `DefaultRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

[`AsyncLiveQuery`](AsyncLiveQuery.md)<`QO`, `TO`, `QB`, `TB`\>

#### Defined in

[record-cache/src/async-record-cache.ts:342](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L342)

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

▸ **patch**(`operationOrOperations`): `Promise`<[`PatchResult`](../interfaces/PatchResult.md)\>

Patches the cache with an operation or operations.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `operationOrOperations` | `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation` \| `RecordOperation`[] \| `AddRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `UpdateRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceKeyTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceAttributeTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `AddToRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveFromRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RecordOperationTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\>[] \| `TransformBuilderFunc`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |

#### Returns

`Promise`<[`PatchResult`](../interfaces/PatchResult.md)\>

#### Defined in

[record-cache/src/async-record-cache.ts:315](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L315)

___

### query

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`RequestData`\>

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

`Promise`<`RequestData`\>

#### Implementation of

AsyncRecordQueryable.query

#### Defined in

[record-cache/src/async-record-cache.ts:235](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L235)

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `QueryResponseDetails`, `RecordOperation`\>\>

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

`Promise`<`FullResponse`<`RequestData`, `QueryResponseDetails`, `RecordOperation`\>\>

#### Implementation of

AsyncRecordQueryable.query

#### Defined in

[record-cache/src/async-record-cache.ts:240](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L240)

___

### removeInverseRelationshipsAsync

▸ `Abstract` **removeInverseRelationshipsAsync**(`relationships`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | [`RecordRelationshipIdentity`](../interfaces/RecordRelationshipIdentity.md)[] |

#### Returns

`Promise`<`void`\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[removeInverseRelationshipsAsync](../interfaces/AsyncRecordAccessor.md#removeinverserelationshipsasync)

#### Defined in

[record-cache/src/async-record-cache.ts:176](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L176)

___

### removeRecordAsync

▸ `Abstract` **removeRecordAsync**(`recordIdentity`): `Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[removeRecordAsync](../interfaces/AsyncRecordAccessor.md#removerecordasync)

#### Defined in

[record-cache/src/async-record-cache.ts:167](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L167)

___

### removeRecordsAsync

▸ `Abstract` **removeRecordsAsync**(`recordIdentities`): `Promise`<`InitializedRecord`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentities` | `RecordIdentity`[] |

#### Returns

`Promise`<`InitializedRecord`[]\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[removeRecordsAsync](../interfaces/AsyncRecordAccessor.md#removerecordsasync)

#### Defined in

[record-cache/src/async-record-cache.ts:170](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L170)

___

### setRecordAsync

▸ `Abstract` **setRecordAsync**(`record`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

`Promise`<`void`\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[setRecordAsync](../interfaces/AsyncRecordAccessor.md#setrecordasync)

#### Defined in

[record-cache/src/async-record-cache.ts:165](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L165)

___

### setRecordsAsync

▸ `Abstract` **setRecordsAsync**(`records`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `InitializedRecord`[] |

#### Returns

`Promise`<`void`\>

#### Implementation of

[AsyncRecordAccessor](../interfaces/AsyncRecordAccessor.md).[setRecordsAsync](../interfaces/AsyncRecordAccessor.md#setrecordsasync)

#### Defined in

[record-cache/src/async-record-cache.ts:166](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L166)

___

### update

▸ **update**<`RequestData`\>(`transformOrOperations`, `options?`, `id?`): `Promise`<`RequestData`\>

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

`Promise`<`RequestData`\>

#### Implementation of

AsyncRecordUpdatable.update

#### Defined in

[record-cache/src/async-record-cache.ts:272](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L272)

▸ **update**<`RequestData`\>(`transformOrOperations`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `TransformResponseDetails`, `RecordOperation`\>\>

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

`Promise`<`FullResponse`<`RequestData`, `TransformResponseDetails`, `RecordOperation`\>\>

#### Implementation of

AsyncRecordUpdatable.update

#### Defined in

[record-cache/src/async-record-cache.ts:277](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L277)
