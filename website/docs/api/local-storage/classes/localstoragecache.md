---
id: "LocalStorageCache"
title: "Class: LocalStorageCache<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "LocalStorageCache"
sidebar_position: 0
custom_edit_url: null
---

A cache used to access records in local storage.

Because local storage access is synchronous, this cache extends `SyncRecordCache`.

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions``RecordCacheQueryOptions` |
| `TO` | extends `RequestOptions``RecordCacheTransformOptions` |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |
| `QRD` | `unknown` |
| `TRD` | extends `RecordCacheUpdateDetails``RecordCacheUpdateDetails` |

## Hierarchy

- `SyncRecordCache`<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

  ↳ **`LocalStorageCache`**

## Constructors

### constructor

• **new LocalStorageCache**<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>(`settings`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions``RecordCacheQueryOptions` |
| `TO` | extends `RequestOptions``RecordCacheTransformOptions` |
| `QB` | `RecordQueryBuilder`<`string`, `RecordIdentity`\> |
| `TB` | `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\> |
| `QRD` | `unknown` |
| `TRD` | extends `RecordCacheUpdateDetails``RecordCacheUpdateDetails` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`LocalStorageCacheSettings`](../interfaces/LocalStorageCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Overrides

SyncRecordCache&lt;QO, TO, QB, TB, QRD, TRD\&gt;.constructor

#### Defined in

[local-storage/src/local-storage-cache.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L63)

## Accessors

### defaultQueryOptions

• `get` **defaultQueryOptions**(): `undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`QueryOptions`\>

#### Defined in

record-cache/dist/modules/record-cache.d.ts:43

• `set` **defaultQueryOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`QueryOptions`\> |

#### Returns

`void`

#### Defined in

record-cache/dist/modules/record-cache.d.ts:44

___

### defaultTransformOptions

• `get` **defaultTransformOptions**(): `undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`TransformOptions`\>

#### Defined in

record-cache/dist/modules/record-cache.d.ts:45

• `set` **defaultTransformOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`TransformOptions`\> |

#### Returns

`void`

#### Defined in

record-cache/dist/modules/record-cache.d.ts:46

___

### delimiter

• `get` **delimiter**(): `string`

#### Returns

`string`

#### Defined in

[local-storage/src/local-storage-cache.ts:74](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L74)

___

### keyMap

• `get` **keyMap**(): `undefined` \| `RecordKeyMap`

#### Returns

`undefined` \| `RecordKeyMap`

#### Defined in

record-cache/dist/modules/record-cache.d.ts:39

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

record-cache/dist/modules/record-cache.d.ts:37

___

### namespace

• `get` **namespace**(): `string`

#### Returns

`string`

#### Defined in

[local-storage/src/local-storage-cache.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L70)

___

### processors

• `get` **processors**(): `SyncOperationProcessor`[]

#### Returns

`SyncOperationProcessor`[]

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:32

___

### queryBuilder

• `get` **queryBuilder**(): `QueryBuilder`

#### Returns

`QueryBuilder`

#### Defined in

record-cache/dist/modules/record-cache.d.ts:41

___

### schema

• `get` **schema**(): `RecordSchema`

#### Returns

`RecordSchema`

#### Defined in

record-cache/dist/modules/record-cache.d.ts:38

___

### transformBuilder

• `get` **transformBuilder**(): `TransformBuilder`

#### Returns

`TransformBuilder`

#### Defined in

record-cache/dist/modules/record-cache.d.ts:42

___

### validatorFor

• `get` **validatorFor**(): `undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Returns

`undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Defined in

record-cache/dist/modules/record-cache.d.ts:40

## Methods

### addInverseRelationshipsSync

▸ **addInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | `RecordRelationshipIdentity`[] |

#### Returns

`void`

#### Overrides

SyncRecordCache.addInverseRelationshipsSync

#### Defined in

[local-storage/src/local-storage-cache.ts:215](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L215)

___

### applyRecordChangesetSync

▸ **applyRecordChangesetSync**(`changeset`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `changeset` | `RecordChangeset` |

#### Returns

`void`

#### Inherited from

SyncRecordCache.applyRecordChangesetSync

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:45

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

SyncRecordCache.emit

#### Defined in

core/dist/modules/evented.d.ts:23

___

### getInverseRelationshipsSync

▸ **getInverseRelationshipsSync**(`recordIdentityOrIdentities`): `RecordRelationshipIdentity`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentityOrIdentities` | `RecordIdentity` \| `RecordIdentity`[] |

#### Returns

`RecordRelationshipIdentity`[]

#### Overrides

SyncRecordCache.getInverseRelationshipsSync

#### Defined in

[local-storage/src/local-storage-cache.ts:193](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L193)

___

### getInverseTransformOperator

▸ **getInverseTransformOperator**(`op`): `SyncInverseTransformOperator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

`SyncInverseTransformOperator`

#### Inherited from

SyncRecordCache.getInverseTransformOperator

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:35

___

### getKeyForRecord

▸ **getKeyForRecord**(`record`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RecordIdentity` \| `InitializedRecord` |

#### Returns

`string`

#### Defined in

[local-storage/src/local-storage-cache.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L78)

___

### getKeyForRecordInverses

▸ **getKeyForRecordInverses**(`record`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RecordIdentity` \| `InitializedRecord` |

#### Returns

`string`

#### Defined in

[local-storage/src/local-storage-cache.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L82)

___

### getQueryOperator

▸ **getQueryOperator**(`op`): `SyncQueryOperator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

`SyncQueryOperator`

#### Inherited from

SyncRecordCache.getQueryOperator

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:33

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

SyncRecordCache.getQueryOptions

#### Defined in

record-cache/dist/modules/record-cache.d.ts:47

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

SyncRecordCache.getRecordSync

#### Defined in

[local-storage/src/local-storage-cache.ts:88](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L88)

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

SyncRecordCache.getRecordsSync

#### Defined in

[local-storage/src/local-storage-cache.ts:105](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L105)

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

SyncRecordCache.getRelatedRecordSync

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:46

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

SyncRecordCache.getRelatedRecordsSync

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:47

___

### getTransformOperator

▸ **getTransformOperator**(`op`): `SyncTransformOperator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

`SyncTransformOperator`

#### Inherited from

SyncRecordCache.getTransformOperator

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:34

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

SyncRecordCache.getTransformOptions

#### Defined in

record-cache/dist/modules/record-cache.d.ts:48

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

SyncRecordCache.listeners

#### Defined in

core/dist/modules/evented.d.ts:24

___

### liveQuery

▸ **liveQuery**(`queryOrExpressions`, `options?`, `id?`): `SyncLiveQuery`<`QO`, `TO`, `QB`, `TB`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options?` | `DefaultRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

`SyncLiveQuery`<`QO`, `TO`, `QB`, `TB`\>

#### Inherited from

SyncRecordCache.liveQuery

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:64

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

SyncRecordCache.off

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

SyncRecordCache.on

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

SyncRecordCache.one

#### Defined in

core/dist/modules/evented.d.ts:22

___

### patch

▸ **patch**(`operationOrOperations`): `PatchResult`

Patches the cache with an operation or operations.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `operationOrOperations` | `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation` \| `RecordOperation`[] \| `AddRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `UpdateRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceKeyTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceAttributeTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `AddToRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveFromRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RecordOperationTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\>[] \| `TransformBuilderFunc`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |

#### Returns

`PatchResult`

#### Inherited from

SyncRecordCache.patch

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:63

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

#### Inherited from

SyncRecordCache.query

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:51

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options`, `id?`): `FullResponse`<`RequestData`, `QRD`, `RecordOperation`\>

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

`FullResponse`<`RequestData`, `QRD`, `RecordOperation`\>

#### Inherited from

SyncRecordCache.query

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:52

___

### removeInverseRelationshipsSync

▸ **removeInverseRelationshipsSync**(`relationships`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | `RecordRelationshipIdentity`[] |

#### Returns

`void`

#### Overrides

SyncRecordCache.removeInverseRelationshipsSync

#### Defined in

[local-storage/src/local-storage-cache.ts:227](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L227)

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

SyncRecordCache.removeRecordSync

#### Defined in

[local-storage/src/local-storage-cache.ts:167](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L167)

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

SyncRecordCache.removeRecordsSync

#### Defined in

[local-storage/src/local-storage-cache.ts:180](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L180)

___

### reset

▸ **reset**(): `void`

#### Returns

`void`

#### Defined in

[local-storage/src/local-storage-cache.ts:247](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L247)

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

SyncRecordCache.setRecordSync

#### Defined in

[local-storage/src/local-storage-cache.ts:151](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L151)

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

SyncRecordCache.setRecordsSync

#### Defined in

[local-storage/src/local-storage-cache.ts:161](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L161)

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

#### Inherited from

SyncRecordCache.update

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:56

▸ **update**<`RequestData`\>(`transformOrOperations`, `options`, `id?`): `FullResponse`<`RequestData`, `TRD`, `RecordOperation`\>

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

`FullResponse`<`RequestData`, `TRD`, `RecordOperation`\>

#### Inherited from

SyncRecordCache.update

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:57

___

### upgrade

▸ **upgrade**(): `void`

#### Returns

`void`

#### Defined in

[local-storage/src/local-storage-cache.ts:259](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L259)
