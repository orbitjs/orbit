---
id: "Task"
title: "Interface: Task<Type, Data, Options>"
sidebar_label: "Task"
sidebar_position: 0
custom_edit_url: null
---

A `Task` represents work to be performed asynchronously.

Tasks can be identified with a `type` and `id`, although only `type` is
required. Processors may use `id` for tracking purposes.

A task's optional `data` can be applied during processing, which may be
further influenced by its `options`.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Type` | `string` |
| `Data` | `unknown` |
| `Options` | `unknown` |

## Properties

### data

• `Optional` **data**: `Data`

#### Defined in

[packages/@orbit/core/src/task.ts:13](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task.ts#L13)

___

### id

• `Optional` **id**: `string`

#### Defined in

[packages/@orbit/core/src/task.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task.ts#L12)

___

### options

• `Optional` **options**: `Options`

#### Defined in

[packages/@orbit/core/src/task.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task.ts#L14)

___

### type

• **type**: `Type`

#### Defined in

[packages/@orbit/core/src/task.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task.ts#L11)
