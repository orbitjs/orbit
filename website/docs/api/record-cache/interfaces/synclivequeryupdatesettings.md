---
id: "SyncLiveQueryUpdateSettings"
title: "Interface: SyncLiveQueryUpdateSettings<QO, TO, QB, TB>"
sidebar_label: "SyncLiveQueryUpdateSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordCacheQueryOptions`](RecordCacheQueryOptions.md) |
| `TO` | extends `RequestOptions`[`RecordCacheTransformOptions`](RecordCacheTransformOptions.md) |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |

## Properties

### cache

• **cache**: [`SyncRecordCache`](../classes/SyncRecordCache.md)<`QO`, `TO`, `QB`, `TB`, `unknown`, [`RecordCacheUpdateDetails`](RecordCacheUpdateDetails.md)\>

#### Defined in

[record-cache/src/live-query/sync-live-query.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/sync-live-query.ts#L22)

___

### query

• **query**: `RecordQuery`

#### Defined in

[record-cache/src/live-query/sync-live-query.ts:23](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/sync-live-query.ts#L23)
