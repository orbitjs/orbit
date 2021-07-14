---
id: "SyncLiveQueryUpdate"
title: "Class: SyncLiveQueryUpdate<QO, TO, QB, TB>"
sidebar_label: "SyncLiveQueryUpdate"
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

• **new SyncLiveQueryUpdate**<`QO`, `TO`, `QB`, `TB`\>(`settings`)

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
| `settings` | [`SyncLiveQueryUpdateSettings`](../interfaces/SyncLiveQueryUpdateSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Defined in

[record-cache/src/live-query/sync-live-query.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/sync-live-query.ts#L35)

## Methods

### query

▸ **query**<`Result`\>(): `Result`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | extends `RecordQueryResult`<`InitializedRecord`\>`RecordQueryResult`<`InitializedRecord`\> |

#### Returns

`Result`

#### Defined in

[record-cache/src/live-query/sync-live-query.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/sync-live-query.ts#L40)
