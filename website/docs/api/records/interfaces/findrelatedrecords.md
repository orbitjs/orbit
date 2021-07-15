---
id: "FindRelatedRecords"
title: "Interface: FindRelatedRecords"
sidebar_label: "FindRelatedRecords"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `QueryExpression`

  ↳ **`FindRelatedRecords`**

## Properties

### filter

• `Optional` **filter**: [`FilterSpecifier`](../modules.md#filterspecifier)[]

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:81](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L81)

___

### op

• **op**: ``"findRelatedRecords"``

#### Overrides

QueryExpression.op

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:77](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L77)

___

### options

• `Optional` **options**: `RequestOptions`

#### Inherited from

QueryExpression.options

#### Defined in

packages/@orbit/data/dist/modules/query-expression.d.ts:4

___

### page

• `Optional` **page**: [`BasePageSpecifier`](BasePageSpecifier.md) \| [`OffsetLimitPageSpecifier`](OffsetLimitPageSpecifier.md)

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L82)

___

### record

• **record**: [`RecordIdentity`](RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L78)

___

### relationship

• **relationship**: `string`

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:79](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L79)

___

### sort

• `Optional` **sort**: [`SortSpecifier`](../modules.md#sortspecifier)[]

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L80)
