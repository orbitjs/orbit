---
id: "LocalStorageSource"
title: "Class: LocalStorageSource<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "LocalStorageSource"
sidebar_position: 0
custom_edit_url: null
---

Source for storing data in localStorage.

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions``RecordSourceQueryOptions` |
| `TO` | extends `RequestOptions``RequestOptions` |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |
| `QRD` | `unknown` |
| `TRD` | extends `RecordCacheUpdateDetails``RecordCacheUpdateDetails` |

## Hierarchy

- `RecordSource`<`QO`, `TO`, `QB`, `TB`\>

- `RecordSyncable`

- `RecordPullable`<`QRD`\>

- `RecordPushable`<`TRD`\>

- `RecordQueryable`<`QRD`, `QB`, `QO`\>

- `RecordUpdatable`<`TRD`, `TB`, `TO`\>

- `Resettable`

  ↳ **`LocalStorageSource`**

## Implements

- `RecordSyncable`
- `RecordQueryable`<`QRD`, `QB`, `QO`\>
- `RecordUpdatable`<`TRD`, `TB`, `TO`\>

## Constructors

### constructor

• **new LocalStorageSource**<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>(`settings`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions``RecordSourceQueryOptions` |
| `TO` | extends `RequestOptions``RequestOptions` |
| `QB` | `RecordQueryBuilder`<`string`, `RecordIdentity`\> |
| `TB` | `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\> |
| `QRD` | `unknown` |
| `TRD` | extends `RecordCacheUpdateDetails``RecordCacheUpdateDetails` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`LocalStorageSourceSettings`](../interfaces/LocalStorageSourceSettings.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\> |

#### Inherited from

RecordSource<QO, TO, QB, TB\>.constructor

#### Defined in

[local-storage/src/local-storage-source.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L100)

## Accessors

### activated

• `get` **activated**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

data/dist/modules/source.d.ts:54

___

### bucket

• `get` **bucket**(): `undefined` \| `Bucket`<`unknown`\>

#### Returns

`undefined` \| `Bucket`<`unknown`\>

#### Defined in

data/dist/modules/source.d.ts:37

___

### cache

• `get` **cache**(): [`LocalStorageCache`](LocalStorageCache.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

#### Returns

[`LocalStorageCache`](LocalStorageCache.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

#### Defined in

[local-storage/src/local-storage-source.ts:142](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L142)

___

### defaultQueryOptions

• `get` **defaultQueryOptions**(): `undefined` \| `DefaultRequestOptions`<`QO`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`QO`\>

#### Defined in

[local-storage/src/local-storage-source.ts:154](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L154)

• `set` **defaultQueryOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`QO`\> |

#### Returns

`void`

#### Defined in

[local-storage/src/local-storage-source.ts:158](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L158)

___

### defaultTransformOptions

• `get` **defaultTransformOptions**(): `undefined` \| `DefaultRequestOptions`<`TO`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`TO`\>

#### Defined in

[local-storage/src/local-storage-source.ts:162](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L162)

• `set` **defaultTransformOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`TO`\> |

#### Returns

`void`

#### Defined in

[local-storage/src/local-storage-source.ts:166](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L166)

___

### delimiter

• `get` **delimiter**(): `string`

#### Returns

`string`

#### Defined in

[local-storage/src/local-storage-source.ts:150](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L150)

___

### keyMap

• `get` **keyMap**(): `undefined` \| `RecordKeyMap`

#### Returns

`undefined` \| `RecordKeyMap`

#### Defined in

records/dist/modules/record-source.d.ts:33

___

### name

• `get` **name**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

data/dist/modules/source.d.ts:36

___

### namespace

• `get` **namespace**(): `string`

#### Returns

`string`

#### Defined in

[local-storage/src/local-storage-source.ts:146](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L146)

___

### queryBuilder

• `get` **queryBuilder**(): `QB`

#### Returns

`QB`

#### Defined in

records/dist/modules/record-source.d.ts:35

___

### requestQueue

• `get` **requestQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

data/dist/modules/source.d.ts:39

___

### schema

• `get` **schema**(): `RecordSchema`

#### Returns

`RecordSchema`

#### Defined in

records/dist/modules/record-source.d.ts:32

___

### syncQueue

• `get` **syncQueue**(): `TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Returns

`TaskQueue`<`string`, `unknown`, `unknown`, `unknown`\>

#### Defined in

data/dist/modules/source.d.ts:40

___

### transformBuilder

• `get` **transformBuilder**(): `TB`

#### Returns

`TB`

#### Defined in

records/dist/modules/record-source.d.ts:36

___

### transformLog

• `get` **transformLog**(): `Log`

#### Returns

`Log`

#### Defined in

data/dist/modules/source.d.ts:38

___

### validatorFor

• `get` **validatorFor**(): `undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Returns

`undefined` \| `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Defined in

records/dist/modules/record-source.d.ts:34

## Methods

### \_pull

▸ **_pull**(`query`): `Promise`<`FullResponse`<`undefined`, `QRD`, `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `RecordQuery` |

#### Returns

`Promise`<`FullResponse`<`undefined`, `QRD`, `RecordOperation`\>\>

#### Inherited from

RecordPullable.\_pull

#### Defined in

[local-storage/src/local-storage-source.ts:303](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L303)

___

### \_push

▸ **_push**(`transform`): `Promise`<`FullResponse`<`undefined`, `TRD`, `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `RecordTransform` |

#### Returns

`Promise`<`FullResponse`<`undefined`, `TRD`, `RecordOperation`\>\>

#### Inherited from

RecordPushable.\_push

#### Defined in

[local-storage/src/local-storage-source.ts:286](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L286)

___

### \_query

▸ **_query**(`query`, `hints?`): `Promise`<`FullResponse`<`RecordQueryResult`<`InitializedRecord`\>, `QRD`, `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `RecordQuery` |
| `hints?` | `ResponseHints`<`RecordQueryResult`<`InitializedRecord`\>, `QRD`\> |

#### Returns

`Promise`<`FullResponse`<`RecordQueryResult`<`InitializedRecord`\>, `QRD`, `RecordOperation`\>\>

#### Inherited from

RecordQueryable.\_query

#### Defined in

[local-storage/src/local-storage-source.ts:247](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L247)

___

### \_sync

▸ **_sync**(`transform`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `RecordTransform` |

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSyncable.\_sync

#### Defined in

[local-storage/src/local-storage-source.ts:190](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L190)

___

### \_update

▸ **_update**(`transform`, `hints?`): `Promise`<`FullResponse`<`RecordTransformResult`<`InitializedRecord`\>, `TRD`, `RecordOperation`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `RecordTransform` |
| `hints?` | `ResponseHints`<`RecordTransformResult`<`InitializedRecord`\>, `TRD`\> |

#### Returns

`Promise`<`FullResponse`<`RecordTransformResult`<`InitializedRecord`\>, `TRD`, `RecordOperation`\>\>

#### Inherited from

RecordUpdatable.\_update

#### Defined in

[local-storage/src/local-storage-source.ts:201](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L201)

___

### activate

▸ **activate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.activate

#### Defined in

data/dist/modules/source.d.ts:55

___

### deactivate

▸ **deactivate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.deactivate

#### Defined in

data/dist/modules/source.d.ts:56

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

RecordSource.emit

#### Defined in

core/dist/modules/evented.d.ts:23

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

[local-storage/src/local-storage-source.ts:170](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L170)

___

### getQueryOptions

▸ **getQueryOptions**(`query`, `expression?`): `undefined` \| `QO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `Query`<`QueryExpression`\> |
| `expression?` | `QueryExpression` |

#### Returns

`undefined` \| `QO`

#### Inherited from

RecordSource.getQueryOptions

#### Defined in

data/dist/modules/source.d.ts:47

___

### getTransformOptions

▸ **getTransformOptions**(`transform`, `operation?`): `undefined` \| `TO`

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | `Transform`<`Operation`\> |
| `operation?` | `Operation` |

#### Returns

`undefined` \| `TO`

#### Inherited from

RecordSource.getTransformOptions

#### Defined in

data/dist/modules/source.d.ts:48

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

RecordSource.listeners

#### Defined in

core/dist/modules/evented.d.ts:24

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

RecordSource.off

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

RecordSource.on

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

RecordSource.one

#### Defined in

core/dist/modules/evented.d.ts:22

___

### perform

▸ **perform**(`task`): `Promise`<`unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `task` | `Task`<`string`, `unknown`, `unknown`\> |

#### Returns

`Promise`<`unknown`\>

#### Inherited from

RecordSource.perform

#### Defined in

data/dist/modules/source.d.ts:49

___

### pull

▸ **pull**<`RequestOperation`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`Transform`<`RequestOperation`\>[]\>

The `pull` method accepts a query or expression(s) and returns a promise
that resolves to an array of `Transform` instances that represent the
changeset that resulted from applying the query. In other words, a `pull`
request retrieves the results of a query in `Transform` form.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>\> |
| `options?` | `DefaultRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`Transform`<`RequestOperation`\>[]\>

#### Inherited from

RecordPullable.pull

#### Defined in

data/dist/modules/source-interfaces/pullable.d.ts:25

▸ **pull**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |
| `RequestDetails` | `QRD` |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>\> |
| `options?` | `FullRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordPullable.pull

#### Defined in

data/dist/modules/source-interfaces/pullable.d.ts:26

___

### push

▸ **push**<`RequestOperation`\>(`transformOrOperations`, `options?`, `id?`): `Promise`<`Transform`<`RequestOperation`\>[]\>

The `push` method accepts a `Transform` instance as an argument and returns
a promise that resolves to an array of `Transform` instances that are
applied as a result. In other words, `push` captures the direct results
_and_ side effects of applying a `Transform` to a source.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |
| `options?` | `DefaultRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`Transform`<`RequestOperation`\>[]\>

#### Inherited from

RecordPushable.push

#### Defined in

data/dist/modules/source-interfaces/pushable.d.ts:23

▸ **push**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`transformOrOperations`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |
| `RequestDetails` | extends `RecordCacheUpdateDetails``TRD` |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |
| `options` | `FullRequestOptions`<`RequestOptions`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordPushable.push

#### Defined in

data/dist/modules/source-interfaces/pushable.d.ts:24

___

### query

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`RequestData`\>

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

RecordQueryable.query

#### Defined in

data/dist/modules/queryable.d.ts:7

▸ **query**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`queryOrExpressions`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |
| `RequestDetails` | `QRD` |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | `QueryOrExpressions`<`RecordQueryExpression`, `QB`\> |
| `options` | `FullRequestOptions`<`QO`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordQueryable.query

#### Defined in

data/dist/modules/queryable.d.ts:8

___

### reset

▸ **reset**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

Resettable.reset

#### Defined in

[local-storage/src/local-storage-source.ts:182](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L182)

___

### sync

▸ **sync**(`transformOrTransforms`): `Promise`<`void`\>

The `sync` method to a source. This method accepts a `Transform` or array
of `Transform`s as an argument and applies it to the source.

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrTransforms` | `Transform`<`RecordOperation`\> \| `Transform`<`RecordOperation`\>[] \| `TransformBuilderFunc`<`RecordOperation`, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\> |

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSyncable.sync

#### Defined in

data/dist/modules/source-interfaces/syncable.d.ts:17

___

### transformed

▸ **transformed**(`transforms`): `Promise`<`void`\>

Notifies listeners that this source has been transformed by emitting the
`transform` event.

Resolves when any promises returned to event listeners are resolved.

Also, adds an entry to the Source's `transformLog` for each transform.

#### Parameters

| Name | Type |
| :------ | :------ |
| `transforms` | `Transform`<`Operation`\>[] |

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.transformed

#### Defined in

data/dist/modules/source.d.ts:65

___

### update

▸ **update**<`RequestData`\>(`transformOrOperations`, `options?`, `id?`): `Promise`<`RequestData`\>

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

RecordUpdatable.update

#### Defined in

data/dist/modules/updatable.d.ts:6

▸ **update**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`transformOrOperations`, `options`, `id?`): `Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |
| `RequestDetails` | extends `RecordCacheUpdateDetails``TRD` |
| `RequestOperation` | extends `RecordOperation``RecordOperation` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | `TransformOrOperations`<`RecordOperation`, `TB`\> |
| `options` | `FullRequestOptions`<`TO`\> |
| `id?` | `string` |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Inherited from

RecordUpdatable.update

#### Defined in

data/dist/modules/updatable.d.ts:7

___

### upgrade

▸ **upgrade**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

RecordSource.upgrade

#### Defined in

[local-storage/src/local-storage-source.ts:174](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L174)
