---
id: "AsyncLiveQueryUpdate"
title: "Class: AsyncLiveQueryUpdate<QO, TO, QB, TB>"
sidebar_label: "AsyncLiveQueryUpdate"
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

## Constructors

### constructor

• **new AsyncLiveQueryUpdate**<`QO`, `TO`, `QB`, `TB`\>(`settings`)

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
| `settings` | [`AsyncLiveQueryUpdateSettings`](../interfaces/AsyncLiveQueryUpdateSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Defined in

[record-cache/src/live-query/async-live-query.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/async-live-query.ts#L35)

## Methods

### query

▸ **query**<`Result`\>(): `Promise`<`Result`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |

#### Returns

`Promise`<`Result`\>

#### Defined in

[record-cache/src/live-query/async-live-query.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/async-live-query.ts#L40)
