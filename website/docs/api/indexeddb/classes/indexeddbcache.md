---
id: "IndexedDBCache"
title: "Class: IndexedDBCache<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "IndexedDBCache"
sidebar_position: 0
custom_edit_url: null
---

A cache used to access records in an IndexedDB database.

Because IndexedDB access is async, this cache extends `AsyncRecordCache`.

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

- `AsyncRecordCache`<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

  ↳ **`IndexedDBCache`**

## Constructors

### constructor

• **new IndexedDBCache**<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>(`settings`)

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
| `settings` | [`IndexedDBCacheSettings`](../interfaces/IndexedDBCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Overrides

AsyncRecordCache&lt;QO, TO, QB, TB, QRD, TRD\&gt;.constructor

#### Defined in

[indexeddb/src/indexeddb-cache.ts:79](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L79)

## Accessors

### dbName

• `get` **dbName**(): `string`

IndexedDB database name.

Defaults to the namespace of the app, which can be overridden in the constructor.

#### Returns

`string`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:119](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L119)

___

### dbVersion

• `get` **dbVersion**(): `number`

The version to specify when opening the IndexedDB database.

#### Returns

`number`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:110](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L110)

___

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

### isDBOpen

• `get` **isDBOpen**(): `boolean`

#### Returns

`boolean`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:123](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L123)

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

[indexeddb/src/indexeddb-cache.ts:87](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L87)

___

### processors

• `get` **processors**(): `AsyncOperationProcessor`[]

#### Returns

`AsyncOperationProcessor`[]

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:33

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

### addInverseRelationshipsAsync

▸ **addInverseRelationshipsAsync**(`relationships`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | `RecordRelationshipIdentity`[] |

#### Returns

`Promise`<`void`\>

#### Overrides

AsyncRecordCache.addInverseRelationshipsAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:505](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L505)

___

### applyRecordChangesetAsync

▸ **applyRecordChangesetAsync**(`changeset`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `changeset` | `RecordChangeset` |

#### Returns

`Promise`<`void`\>

#### Inherited from

AsyncRecordCache.applyRecordChangesetAsync

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:46

___

### clearRecords

▸ **clearRecords**(`type`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[indexeddb/src/indexeddb-cache.ts:227](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L227)

___

### closeDB

▸ **closeDB**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[indexeddb/src/indexeddb-cache.ts:156](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L156)

___

### createDB

▸ **createDB**(`db`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `db` | `IDBDatabase` |

#### Returns

`void`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:175](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L175)

___

### createInverseRelationshipStore

▸ **createInverseRelationshipStore**(`db`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `db` | `IDBDatabase` |

#### Returns

`void`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:183](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L183)

___

### deleteDB

▸ **deleteDB**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[indexeddb/src/indexeddb-cache.ts:205](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L205)

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

AsyncRecordCache.emit

#### Defined in

core/dist/modules/evented.d.ts:23

___

### getInverseRelationshipsAsync

▸ **getInverseRelationshipsAsync**(`recordIdentityOrIdentities`): `Promise`<`RecordRelationshipIdentity`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentityOrIdentities` | `RecordIdentity` \| `RecordIdentity`[] |

#### Returns

`Promise`<`RecordRelationshipIdentity`[]\>

#### Overrides

AsyncRecordCache.getInverseRelationshipsAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:448](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L448)

___

### getInverseTransformOperator

▸ **getInverseTransformOperator**(`op`): `AsyncInverseTransformOperator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

`AsyncInverseTransformOperator`

#### Inherited from

AsyncRecordCache.getInverseTransformOperator

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:36

___

### getQueryOperator

▸ **getQueryOperator**(`op`): `AsyncQueryOperator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

`AsyncQueryOperator`

#### Inherited from

AsyncRecordCache.getQueryOperator

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:34

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

AsyncRecordCache.getQueryOptions

#### Defined in

record-cache/dist/modules/record-cache.d.ts:47

___

### getRecordAsync

▸ **getRecordAsync**(`record`): `Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RecordIdentity` |

#### Returns

`Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Overrides

AsyncRecordCache.getRecordAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:245](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L245)

___

### getRecordsAsync

▸ **getRecordsAsync**(`typeOrIdentities?`): `Promise`<`InitializedRecord`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeOrIdentities?` | `string` \| `RecordIdentity`[] |

#### Returns

`Promise`<`InitializedRecord`[]\>

#### Overrides

AsyncRecordCache.getRecordsAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:271](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L271)

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

#### Inherited from

AsyncRecordCache.getRelatedRecordAsync

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:47

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

#### Inherited from

AsyncRecordCache.getRelatedRecordsAsync

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:48

___

### getTransformOperator

▸ **getTransformOperator**(`op`): `AsyncTransformOperator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `string` |

#### Returns

`AsyncTransformOperator`

#### Inherited from

AsyncRecordCache.getTransformOperator

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:35

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

AsyncRecordCache.getTransformOptions

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

AsyncRecordCache.listeners

#### Defined in

core/dist/modules/evented.d.ts:24

___

### liveQuery

▸ **liveQuery**(`queryOrExpressions`, `options?`, `id?`): `AsyncLiveQuery`<`QO`, `TO`, `QB`, `TB`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options?` | `DefaultRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

`AsyncLiveQuery`<`QO`, `TO`, `QB`, `TB`\>

#### Inherited from

AsyncRecordCache.liveQuery

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:65

___

### migrateDB

▸ **migrateDB**(`db`, `event`): `void`

Migrate database.

#### Parameters

| Name | Type |
| :------ | :------ |
| `db` | `IDBDatabase` |
| `event` | `IDBVersionChangeEvent` |

#### Returns

`void`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:196](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L196)

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

AsyncRecordCache.off

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

AsyncRecordCache.on

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

AsyncRecordCache.one

#### Defined in

core/dist/modules/evented.d.ts:22

___

### openDB

▸ **openDB**(): `Promise`<`IDBDatabase`\>

#### Returns

`Promise`<`IDBDatabase`\>

#### Defined in

[indexeddb/src/indexeddb-cache.ts:127](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L127)

___

### patch

▸ **patch**(`operationOrOperations`): `Promise`<`PatchResult`\>

Patches the cache with an operation or operations.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `operationOrOperations` | `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation` \| `RecordOperation`[] \| `AddRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `UpdateRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceKeyTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceAttributeTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `AddToRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RemoveFromRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordsTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `ReplaceRelatedRecordTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\> \| `RecordOperationTerm`<`string`, `RecordIdentity`, `UninitializedRecord`\>[] \| `TransformBuilderFunc`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |

#### Returns

`Promise`<`PatchResult`\>

#### Inherited from

AsyncRecordCache.patch

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:64

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

#### Inherited from

AsyncRecordCache.query

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:52

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `QRD`, `RecordOperation`\>\>

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

`Promise`<`FullResponse`<`RequestData`, `QRD`, `RecordOperation`\>\>

#### Inherited from

AsyncRecordCache.query

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:53

___

### registerModel

▸ **registerModel**(`db`, `type`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `db` | `IDBDatabase` |
| `type` | `string` |

#### Returns

`void`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:221](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L221)

___

### removeInverseRelationshipsAsync

▸ **removeInverseRelationshipsAsync**(`relationships`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `relationships` | `RecordRelationshipIdentity`[] |

#### Returns

`Promise`<`void`\>

#### Overrides

AsyncRecordCache.removeInverseRelationshipsAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:534](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L534)

___

### removeRecordAsync

▸ **removeRecordAsync**(`recordIdentity`): `Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RecordIdentity` |

#### Returns

`Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Overrides

AsyncRecordCache.removeRecordAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:399](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L399)

___

### removeRecordsAsync

▸ **removeRecordsAsync**(`records`): `Promise`<`InitializedRecord`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `RecordIdentity`[] |

#### Returns

`Promise`<`InitializedRecord`[]\>

#### Overrides

AsyncRecordCache.removeRecordsAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:417](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L417)

___

### reopenDB

▸ **reopenDB**(): `Promise`<`IDBDatabase`\>

#### Returns

`Promise`<`IDBDatabase`\>

#### Defined in

[indexeddb/src/indexeddb-cache.ts:170](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L170)

___

### reset

▸ **reset**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[indexeddb/src/indexeddb-cache.ts:99](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L99)

___

### setRecordAsync

▸ **setRecordAsync**(`record`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `InitializedRecord` |

#### Returns

`Promise`<`void`\>

#### Overrides

AsyncRecordCache.setRecordAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:344](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L344)

___

### setRecordsAsync

▸ **setRecordsAsync**(`records`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | `InitializedRecord`[] |

#### Returns

`Promise`<`void`\>

#### Overrides

AsyncRecordCache.setRecordsAsync

#### Defined in

[indexeddb/src/indexeddb-cache.ts:362](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L362)

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

#### Inherited from

AsyncRecordCache.update

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:57

▸ **update**<`RequestData`\>(`transformOrOperations`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `TRD`, `RecordOperation`\>\>

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

`Promise`<`FullResponse`<`RequestData`, `TRD`, `RecordOperation`\>\>

#### Inherited from

AsyncRecordCache.update

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:58

___

### upgrade

▸ **upgrade**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[indexeddb/src/indexeddb-cache.ts:91](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L91)
