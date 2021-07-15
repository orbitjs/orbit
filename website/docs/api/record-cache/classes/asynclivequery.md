---
id: "AsyncLiveQuery"
title: "Class: AsyncLiveQuery<QO, TO, QB, TB>"
sidebar_label: "AsyncLiveQuery"
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

## Hierarchy

- `LiveQuery`

  ↳ **`AsyncLiveQuery`**

## Constructors

### constructor

• **new AsyncLiveQuery**<`QO`, `TO`, `QB`, `TB`\>(`settings`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordCacheQueryOptions`](../interfaces/RecordCacheQueryOptions.md) |
| `TO` | extends `RequestOptions`[`RecordCacheTransformOptions`](../interfaces/RecordCacheTransformOptions.md) |
| `QB` | `RecordQueryBuilder`<`string`, `RecordIdentity`\> |
| `TB` | `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`AsyncLiveQuerySettings`](../interfaces/AsyncLiveQuerySettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Overrides

LiveQuery.constructor

#### Defined in

[record-cache/src/live-query/async-live-query.ts:75](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/async-live-query.ts#L75)

## Properties

### debounce

• `Readonly` **debounce**: `boolean`

#### Inherited from

LiveQuery.debounce

#### Defined in

[record-cache/src/live-query/live-query.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/live-query.ts#L24)

## Methods

### operationRelevantForQuery

▸ **operationRelevantForQuery**(`operation`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`boolean`

#### Inherited from

LiveQuery.operationRelevantForQuery

#### Defined in

[record-cache/src/live-query/live-query.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/live-query.ts#L63)

___

### query

▸ **query**<`Result`\>(): `Promise`<`Result`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |

#### Returns

`Promise`<`Result`\>

#### Defined in

[record-cache/src/live-query/async-live-query.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/async-live-query.ts#L80)

___

### subscribe

▸ **subscribe**(`cb`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | (`update`: [`AsyncLiveQueryUpdate`](AsyncLiveQueryUpdate.md)<`QO`, `TO`, `QB`, `TB`\>) => `void` |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Defined in

[record-cache/src/live-query/async-live-query.ts:86](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/async-live-query.ts#L86)
