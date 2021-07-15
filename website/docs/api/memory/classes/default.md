---
id: "default"
title: "Class: default<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "default"
sidebar_position: 0
custom_edit_url: null
---

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

- `RecordQueryable`<`QRD`, `QB`, `QO`\>

- `RecordUpdatable`<`TRD`, `TB`, `TO`\>

  ↳ **`default`**

## Implements

- `RecordSyncable`
- `RecordQueryable`<`QRD`, `QB`, `QO`\>
- `RecordUpdatable`<`TRD`, `TB`, `TO`\>

## Constructors

### constructor

• **new default**<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>(`settings`)

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
| `settings` | [`MemorySourceSettings`](../interfaces/MemorySourceSettings.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\> |

#### Inherited from

RecordSource<QO, TO, QB, TB\>.constructor

#### Defined in

[memory/src/memory-source.ts:97](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L97)

## Accessors

### activated

• `get` **activated**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

data/dist/modules/source.d.ts:54

___

### base

• `get` **base**(): `undefined` \| [`default`](default.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

#### Returns

`undefined` \| [`default`](default.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

#### Defined in

[memory/src/memory-source.ts:148](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L148)

___

### bucket

• `get` **bucket**(): `undefined` \| `Bucket`<`unknown`\>

#### Returns

`undefined` \| `Bucket`<`unknown`\>

#### Defined in

data/dist/modules/source.d.ts:37

___

### cache

• `get` **cache**(): [`MemoryCache`](MemoryCache.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

#### Returns

[`MemoryCache`](MemoryCache.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

#### Defined in

[memory/src/memory-source.ts:144](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L144)

___

### defaultQueryOptions

• `get` **defaultQueryOptions**(): `undefined` \| `DefaultRequestOptions`<`QO`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`QO`\>

#### Defined in

[memory/src/memory-source.ts:438](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L438)

• `set` **defaultQueryOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`QO`\> |

#### Returns

`void`

#### Defined in

[memory/src/memory-source.ts:442](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L442)

___

### defaultTransformOptions

• `get` **defaultTransformOptions**(): `undefined` \| `DefaultRequestOptions`<`TO`\>

#### Returns

`undefined` \| `DefaultRequestOptions`<`TO`\>

#### Defined in

[memory/src/memory-source.ts:446](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L446)

• `set` **defaultTransformOptions**(`options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| `DefaultRequestOptions`<`TO`\> |

#### Returns

`void`

#### Defined in

[memory/src/memory-source.ts:450](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L450)

___

### forkPoint

• `get` **forkPoint**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[memory/src/memory-source.ts:152](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L152)

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

[memory/src/memory-source.ts:221](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L221)

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

[memory/src/memory-source.ts:164](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L164)

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

[memory/src/memory-source.ts:175](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L175)

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

### allTransforms

▸ **allTransforms**(): `RecordTransform`[]

Returns all tracked transforms.

#### Returns

`RecordTransform`[]

#### Defined in

[memory/src/memory-source.ts:426](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L426)

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

### fork

▸ **fork**(`settings?`): [`default`](default.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

Create a clone, or "fork", from a "base" source.

The forked source will have the same `schema` and `keyMap` as its base source.
The forked source's cache will start with the same immutable document as
the base source. Its contents and log will evolve independently.

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`MemorySourceSettings`](../interfaces/MemorySourceSettings.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\> |

#### Returns

[`default`](default.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

The forked source.

#### Defined in

[memory/src/memory-source.ts:269](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L269)

___

### getInverseOperations

▸ **getInverseOperations**(`transformId`): `RecordOperation`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformId` | `string` |

#### Returns

`RecordOperation`[]

#### Defined in

[memory/src/memory-source.ts:434](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L434)

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

### getTransform

▸ **getTransform**(`transformId`): `RecordTransform`

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformId` | `string` |

#### Returns

`RecordTransform`

#### Defined in

[memory/src/memory-source.ts:430](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L430)

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

### merge

▸ **merge**<`RequestData`\>(`forkedSource`, `options?`): `Promise`<`RequestData`\>

Merge transforms from a forked source back into a base source.

By default, all of the operations from all of the transforms in the forked
source's history will be reduced into a single transform. A subset of
operations can be selected by specifying the `sinceTransformId` option.

The `coalesce` option controls whether operations are coalesced into a
minimal equivalent set before being reduced into a transform.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `forkedSource` | [`default`](default.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\> | The source to merge. |
| `options?` | `TO` & { `fullResponse?`: ``false``  } & [`MemorySourceMergeOptions`](../interfaces/MemorySourceMergeOptions.md) | Merge options |

#### Returns

`Promise`<`RequestData`\>

The result of calling `update()` with the forked transforms.

#### Defined in

[memory/src/memory-source.ts:301](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L301)

▸ **merge**<`RequestData`\>(`forkedSource`, `options`): `Promise`<`FullResponse`<`RequestData`, `TRD`, `RecordOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | extends `RecordTransformResult`<`InitializedRecord`\>`RecordTransformResult`<`InitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `forkedSource` | [`default`](default.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\> |
| `options` | `TO` & { `fullResponse`: ``true``  } & [`MemorySourceMergeOptions`](../interfaces/MemorySourceMergeOptions.md) |

#### Returns

`Promise`<`FullResponse`<`RequestData`, `TRD`, `RecordOperation`\>\>

#### Defined in

[memory/src/memory-source.ts:305](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L305)

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

### rebase

▸ **rebase**(): `void`

Rebase works similarly to a git rebase:

After a source is forked, there is a parent- and a child-source. Both may be
updated with transforms. If, after some updates on both sources
`childSource.rebase()` is called, the result on the child source will look
like, as if all updates to the parent source were added first, followed by
those made in the child source. This means that updates in the child source
have a tendency of winning.

#### Returns

`void`

#### Defined in

[memory/src/memory-source.ts:369](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L369)

___

### rollback

▸ **rollback**(`transformId`, `relativePosition?`): `Promise`<`void`\>

Rolls back the source to a particular `transformId`.

`relativePosition` can be a positive or negative integer used to specify a
position relative to `transformId`.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `transformId` | `string` | `undefined` |
| `relativePosition` | `number` | `0` |

#### Returns

`Promise`<`void`\>

#### Defined in

[memory/src/memory-source.ts:410](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L410)

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

### transformsSince

▸ **transformsSince**(`transformId`): `RecordTransform`[]

Returns all transforms since a particular `transformId`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformId` | `string` |

#### Returns

`RecordTransform`[]

#### Defined in

[memory/src/memory-source.ts:417](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L417)

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

[memory/src/memory-source.ts:156](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-source.ts#L156)
