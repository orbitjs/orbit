---
id: "IndexedDBCacheClass"
title: "Interface: IndexedDBCacheClass<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "IndexedDBCacheClass"
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

• **new IndexedDBCacheClass**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`IndexedDBCacheSettings`](IndexedDBCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\> |

#### Defined in

[indexeddb/src/indexeddb-cache.ts:52](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L52)
