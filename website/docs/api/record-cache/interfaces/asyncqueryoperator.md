---
id: "AsyncQueryOperator"
title: "Interface: AsyncQueryOperator"
sidebar_label: "AsyncQueryOperator"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### AsyncQueryOperator

▸ **AsyncQueryOperator**(`cache`, `expression`, `options?`): `Promise`<`RecordQueryExpressionResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cache` | [`AsyncRecordAccessor`](AsyncRecordAccessor.md) |
| `expression` | `RecordQueryExpression` |
| `options?` | `RequestOptions` |

#### Returns

`Promise`<`RecordQueryExpressionResult`<`InitializedRecord`\>\>

#### Defined in

[record-cache/src/operators/async-query-operators.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/async-query-operators.ts#L19)
