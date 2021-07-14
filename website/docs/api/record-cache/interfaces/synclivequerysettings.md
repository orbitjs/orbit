---
id: "SyncLiveQuerySettings"
title: "Interface: SyncLiveQuerySettings<QO, TO, QB, TB>"
sidebar_label: "SyncLiveQuerySettings"
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

## Hierarchy

- `LiveQuerySettings`

  ↳ **`SyncLiveQuerySettings`**

## Properties

### cache

• **cache**: [`SyncRecordCache`](../classes/SyncRecordCache.md)<`QO`, `TO`, `QB`, `TB`, `unknown`, [`RecordCacheUpdateDetails`](RecordCacheUpdateDetails.md)\>

#### Defined in

[record-cache/src/live-query/sync-live-query.ts:51](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/sync-live-query.ts#L51)

___

### debounce

• **debounce**: `boolean`

#### Inherited from

LiveQuerySettings.debounce

#### Defined in

[record-cache/src/live-query/live-query.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/live-query.ts#L19)

___

### query

• **query**: `RecordQuery`

#### Inherited from

LiveQuerySettings.query

#### Defined in

[record-cache/src/live-query/live-query.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/live-query/live-query.ts#L20)
