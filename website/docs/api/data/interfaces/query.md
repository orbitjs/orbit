---
id: "Query"
title: "Interface: Query<QE>"
sidebar_label: "Query"
sidebar_position: 0
custom_edit_url: null
---

Queries are used to extract data from a source.

Each query's `expressions` must be a query expression or an array of
expressions. This distinction allows for a clear distinction between queries
that return singular vs. arrayed results.

## Type parameters

| Name | Type |
| :------ | :------ |
| `QE` | extends [`QueryExpression`](QueryExpression.md) |

## Properties

### expressions

• **expressions**: `QE` \| `QE`[]

#### Defined in

[packages/@orbit/data/src/query.ts:15](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L15)

___

### id

• **id**: `string`

#### Defined in

[packages/@orbit/data/src/query.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L14)

___

### options

• `Optional` **options**: [`RequestOptions`](RequestOptions.md)

#### Defined in

[packages/@orbit/data/src/query.ts:16](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/query.ts#L16)
