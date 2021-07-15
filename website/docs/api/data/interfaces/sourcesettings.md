---
id: "SourceSettings"
title: "Interface: SourceSettings<QueryOptions, TransformOptions, QueryBuilder, TransformBuilder>"
sidebar_label: "SourceSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QueryOptions` | extends [`RequestOptions`](RequestOptions.md)[`RequestOptions`](RequestOptions.md) |
| `TransformOptions` | extends [`RequestOptions`](RequestOptions.md)[`RequestOptions`](RequestOptions.md) |
| `QueryBuilder` | `unknown` |
| `TransformBuilder` | `unknown` |

## Properties

### autoActivate

• `Optional` **autoActivate**: `boolean`

#### Defined in

[packages/@orbit/data/src/source.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L35)

___

### bucket

• `Optional` **bucket**: `Bucket`<`unknown`\>

#### Defined in

[packages/@orbit/data/src/source.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L32)

___

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`QueryOptions`\>

#### Defined in

[packages/@orbit/data/src/source.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L38)

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`TransformOptions`\>

#### Defined in

[packages/@orbit/data/src/source.ts:39](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L39)

___

### name

• `Optional` **name**: `string`

#### Defined in

[packages/@orbit/data/src/source.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L31)

___

### queryBuilder

• `Optional` **queryBuilder**: `QueryBuilder`

#### Defined in

[packages/@orbit/data/src/source.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L33)

___

### requestQueueSettings

• `Optional` **requestQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Defined in

[packages/@orbit/data/src/source.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L36)

___

### syncQueueSettings

• `Optional` **syncQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Defined in

[packages/@orbit/data/src/source.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L37)

___

### transformBuilder

• `Optional` **transformBuilder**: `TransformBuilder`

#### Defined in

[packages/@orbit/data/src/source.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source.ts#L34)
