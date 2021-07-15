---
id: "OperationTerm"
title: "Class: OperationTerm<O>"
sidebar_label: "OperationTerm"
sidebar_position: 0
custom_edit_url: null
---

Operation terms are used by transform builders to allow for the construction of
operations in composable patterns.

## Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`Operation`](../interfaces/Operation.md) |

## Constructors

### constructor

• **new OperationTerm**<`O`\>(`operation`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`Operation`](../interfaces/Operation.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `O` |

#### Defined in

[packages/@orbit/data/src/operation-term.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/operation-term.ts#L12)

## Methods

### options

▸ **options**(`options`): [`OperationTerm`](OperationTerm.md)<`O`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

[`OperationTerm`](OperationTerm.md)<`O`\>

#### Defined in

[packages/@orbit/data/src/operation-term.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/operation-term.ts#L20)

___

### toOperation

▸ **toOperation**(): `O`

#### Returns

`O`

#### Defined in

[packages/@orbit/data/src/operation-term.ts:16](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/operation-term.ts#L16)
