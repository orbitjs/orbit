---
id: "FindRecords"
title: "Interface: FindRecords"
sidebar_label: "FindRecords"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `QueryExpression`

  ↳ **`FindRecords`**

## Properties

### filter

• `Optional` **filter**: [`FilterSpecifier`](../modules.md#filterspecifier)[]

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:90](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L90)

___

### op

• **op**: ``"findRecords"``

#### Overrides

QueryExpression.op

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:86](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L86)

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

[packages/@orbit/records/src/record-query-expression.ts:91](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L91)

___

### records

• `Optional` **records**: [`RecordIdentity`](RecordIdentity.md)[]

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:87](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L87)

___

### sort

• `Optional` **sort**: [`SortSpecifier`](../modules.md#sortspecifier)[]

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:89](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L89)

___

### type

• `Optional` **type**: `string`

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:88](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L88)
