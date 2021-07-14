---
id: "BaseRecordQueryTerm"
title: "Class: BaseRecordQueryTerm<QE, RT, RI>"
sidebar_label: "BaseRecordQueryTerm"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`RecordQueryExpression`](../modules.md#recordqueryexpression) |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

## Hierarchy

- `QueryTerm`<`QE`\>

  ↳ **`BaseRecordQueryTerm`**

  ↳↳ [`FindRecordTerm`](FindRecordTerm.md)

  ↳↳ [`FindRelatedRecordTerm`](FindRelatedRecordTerm.md)

  ↳↳ [`FindRecordsTerm`](FindRecordsTerm.md)

## Constructors

### constructor

• **new BaseRecordQueryTerm**<`QE`, `RT`, `RI`\>(`queryBuilder`, `expression`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`RecordQueryExpression`](../modules.md#recordqueryexpression) |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryBuilder` | [`RecordQueryBuilder`](RecordQueryBuilder.md)<`RT`, `RI`\> |
| `expression` | `QE` |

#### Overrides

QueryTerm&lt;QE\&gt;.constructor

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L100)

## Properties

### $queryBuilder

• **$queryBuilder**: [`RecordQueryBuilder`](RecordQueryBuilder.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:98](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L98)

## Methods

### options

▸ **options**(`options`): [`BaseRecordQueryTerm`](BaseRecordQueryTerm.md)<`QE`, `RT`, `RI`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`BaseRecordQueryTerm`](BaseRecordQueryTerm.md)<`QE`, `RT`, `RI`\>

#### Inherited from

QueryTerm.options

#### Defined in

packages/@orbit/data/dist/modules/query-term.d.ts:11

___

### toQueryExpression

▸ **toQueryExpression**(): `QE`

#### Returns

`QE`

#### Overrides

QueryTerm.toQueryExpression

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:105](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L105)
