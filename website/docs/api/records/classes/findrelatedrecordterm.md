---
id: "FindRelatedRecordTerm"
title: "Class: FindRelatedRecordTerm<RT, RI>"
sidebar_label: "FindRelatedRecordTerm"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

## Hierarchy

- [`BaseRecordQueryTerm`](BaseRecordQueryTerm.md)<[`FindRelatedRecord`](../interfaces/FindRelatedRecord.md), `RT`, `RI`\>

  ↳ **`FindRelatedRecordTerm`**

## Constructors

### constructor

• **new FindRelatedRecordTerm**<`RT`, `RI`\>(`queryBuilder`, `record`, `relationship`)

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
| `relationship` | `string` |

#### Overrides

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[constructor](BaseRecordQueryTerm.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:154](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L154)

## Properties

### $queryBuilder

• **$queryBuilder**: [`RecordQueryBuilder`](RecordQueryBuilder.md)<`RT`, `RI`\>

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[$queryBuilder](BaseRecordQueryTerm.md#$querybuilder)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:98](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L98)

## Methods

### options

▸ **options**(`options`): [`FindRelatedRecordTerm`](FindRelatedRecordTerm.md)<`RT`, `RI`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`FindRelatedRecordTerm`](FindRelatedRecordTerm.md)<`RT`, `RI`\>

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[options](BaseRecordQueryTerm.md#options)

#### Defined in

packages/@orbit/data/dist/modules/query-term.d.ts:11

___

### toQueryExpression

▸ **toQueryExpression**(): [`FindRelatedRecord`](../interfaces/FindRelatedRecord.md)

#### Returns

[`FindRelatedRecord`](../interfaces/FindRelatedRecord.md)

#### Inherited from

[BaseRecordQueryTerm](BaseRecordQueryTerm.md).[toQueryExpression](BaseRecordQueryTerm.md#toqueryexpression)

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:105](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L105)
