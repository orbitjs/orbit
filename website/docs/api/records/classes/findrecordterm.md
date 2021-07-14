---
id: "FindRecordTerm"
title: "Class: FindRecordTerm<RT, RI>"
sidebar_label: "FindRecordTerm"
sidebar_position: 0
custom_edit_url: null
---

A query term representing a single record.

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

## Hierarchy

- [`BaseRecordQueryTerm`](BaseRecordQueryTerm.md)<[`FindRecord`](../interfaces/FindRecord.md), `RT`, `RI`\>

  ↳ **`FindRecordTerm`**

## Constructors

### constructor

• **new FindRecordTerm**<`RT`, `RI`\>(`queryBuilder`, `record`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryBuilder` | [`RecordQueryBuilder`](RecordQueryBuilder.md)<`RT`, `RI`\> |
| `record` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

#### Overrides

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[constructor](BaseRecordQueryTerm.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:139](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L139)

## Properties

### $queryBuilder

• **$queryBuilder**: [`RecordQueryBuilder`](RecordQueryBuilder.md)<`RT`, `RI`\>

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[$queryBuilder](BaseRecordQueryTerm.md#$querybuilder)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:98](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L98)

## Methods

### options

▸ **options**(`options`): [`FindRecordTerm`](FindRecordTerm.md)<`RT`, `RI`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`FindRecordTerm`](FindRecordTerm.md)<`RT`, `RI`\>

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[options](BaseRecordQueryTerm.md#options)

#### Defined in

packages/@orbit/data/dist/modules/query-term.d.ts:11

___

### toQueryExpression

▸ **toQueryExpression**(): [`FindRecord`](../interfaces/FindRecord.md)

#### Returns

[`FindRecord`](../interfaces/FindRecord.md)

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[toQueryExpression](BaseRecordQueryTerm.md#toqueryexpression)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:105](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L105)
