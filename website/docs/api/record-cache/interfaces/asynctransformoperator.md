---
id: "AsyncTransformOperator"
title: "Interface: AsyncTransformOperator"
sidebar_label: "AsyncTransformOperator"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### AsyncTransformOperator

▸ **AsyncTransformOperator**(`cache`, `operation`, `options?`): `Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cache` | [`AsyncRecordAccessor`](AsyncRecordAccessor.md) |
| `operation` | `RecordOperation` |
| `options?` | `RequestOptions` |

#### Returns

`Promise`<`RecordOperationResult`<`InitializedRecord`\>\>

#### Defined in

[record-cache/src/operators/async-transform-operators.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/async-transform-operators.ts#L26)
