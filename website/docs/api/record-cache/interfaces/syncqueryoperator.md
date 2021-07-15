---
id: "SyncQueryOperator"
title: "Interface: SyncQueryOperator"
sidebar_label: "SyncQueryOperator"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### SyncQueryOperator

▸ **SyncQueryOperator**(`cache`, `expression`, `options?`): `RecordQueryExpressionResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cache` | [`SyncRecordAccessor`](SyncRecordAccessor.md) |
| `expression` | `RecordQueryExpression` |
| `options?` | `RequestOptions` |

#### Returns

`RecordQueryExpressionResult`<`InitializedRecord`\>

#### Defined in

[record-cache/src/operators/sync-query-operators.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/sync-query-operators.ts#L19)
