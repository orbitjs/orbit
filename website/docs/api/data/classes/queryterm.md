---
id: "QueryTerm"
title: "Class: QueryTerm<QE>"
sidebar_label: "QueryTerm"
sidebar_position: 0
custom_edit_url: null
---

Query terms are used by query builders to allow for the construction of
query expressions in composable patterns.

## Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](../interfaces/QueryExpression.md) |

## Constructors

### constructor

• **new QueryTerm**<`QE`\>(`expression`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](../interfaces/QueryExpression.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `expression` | `QE` |

#### Defined in

[packages/@orbit/data/src/query-term.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query-term.ts#L12)

## Methods

### options

▸ **options**(`options`): [`QueryTerm`](QueryTerm.md)<`QE`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

[`QueryTerm`](QueryTerm.md)<`QE`\>

#### Defined in

[packages/@orbit/data/src/query-term.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query-term.ts#L20)

___

### toQueryExpression

▸ **toQueryExpression**(): `QE`

#### Returns

`QE`

#### Defined in

[packages/@orbit/data/src/query-term.ts:16](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query-term.ts#L16)
