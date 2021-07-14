---
id: "MemoryCacheClass"
title: "Interface: MemoryCacheClass<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "MemoryCacheClass"
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

• **new MemoryCacheClass**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`MemoryCacheSettings`](MemoryCacheSettings.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\> |

#### Defined in

[memory/src/memory-cache.ts:39](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/memory/src/memory-cache.ts#L39)
