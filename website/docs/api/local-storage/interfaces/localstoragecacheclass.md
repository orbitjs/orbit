---
id: "LocalStorageCacheClass"
title: "Interface: LocalStorageCacheClass<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "LocalStorageCacheClass"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions``RecordCacheQueryOptions` |
| `TO` | extends `RequestOptions``RecordCacheTransformOptions` |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |
| `QRD` | `unknown` |
| `TRD` | extends `RecordCacheUpdateDetails``RecordCacheUpdateDetails` |

## Constructors

### constructor

• **new LocalStorageCacheClass**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`LocalStorageCacheSettings`](LocalStorageCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Defined in

[local-storage/src/local-storage-cache.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L37)
